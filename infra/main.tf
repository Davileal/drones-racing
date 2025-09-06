terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.50" }
  }
}

provider "aws" {
  region = var.region
}

# ---------------- Web (S3 + CloudFront) ----------------

resource "aws_s3_bucket" "web" {
  bucket = var.web_bucket_name
}

# Block public ACLs; use CloudFront OAC
resource "aws_s3_bucket_public_access_block" "web" {
  bucket                  = aws_s3_bucket_web.id
  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

# Ownership & versioning (optional)
resource "aws_s3_bucket_ownership_controls" "web" {
  bucket = aws_s3_bucket.web.id
  rule { object_ownership = "BucketOwnerPreferred" }
}

resource "aws_s3_bucket_versioning" "web" {
  bucket = aws_s3_bucket.web.id
  versioning_configuration { status = "Enabled" }
}

# CloudFront Origin Access Control (OAC)
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.project}-oac"
  description                       = "OAC for ${var.project} web"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Bucket policy to allow only CloudFront OAC
data "aws_iam_policy_document" "web_policy" {
  statement {
    sid       = "AllowCloudFrontOAC"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.web.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.web.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "web" {
  bucket = aws_s3_bucket.web.id
  policy = data.aws_iam_policy_document.web_policy.json
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "web" {
  enabled             = true
  comment             = "${var.project} web"
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.web.bucket_regional_domain_name
    origin_id                = "s3-${aws_s3_bucket.web.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-${aws_s3_bucket.web.id}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    forwarded_values {
      query_string = true
      headers      = []
      cookies { forward = "none" }
    }
  }

  # SPA: route unknown paths to index.html (handled via S3 error document behavior)
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true # swap to ACM cert + aliases later
  }

  price_class = "PriceClass_100"
}

# ---------------- API (ECR + App Runner) ----------------

resource "aws_ecr_repository" "api" {
  name                 = "${var.project}-api"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

# App Runner connection to ECR image
resource "aws_apprunner_service" "api" {
  service_name = "${var.project}-api"

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr_access.arn
    }
    image_repository {
      image_identifier      = "${aws_ecr_repository.api.repository_url}:latest"
      image_repository_type = "ECR"
      image_configuration {
        port = "3000"
        runtime_environment_variables = {
          NODE_ENV = "production"
        }
      }
    }
    auto_deployments_enabled = true
  }

  instance_configuration {
    cpu    = "0.25 vCPU"
    memory = "512 MB"
  }

  health_check_configuration {
    protocol = "HTTP"
    path     = "/health"
    interval = 10
    timeout  = 5
    healthy_threshold   = 1
    unhealthy_threshold = 3
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.api.arn
}

# Auto scaling (min 0 active instances; App Runner will scale down when idle;
# billing differs between "provisioned" and "active" capacity)
resource "aws_apprunner_auto_scaling_configuration_version" "api" {
  auto_scaling_configuration_name = "${var.project}-api-asg"
  max_concurrency                 = 50
  max_size                        = 3
  min_size                        = 1
}

# IAM for App Runner to pull from ECR
resource "aws_iam_role" "apprunner_ecr_access" {
  name               = "${var.project}-apprunner-ecr"
  assume_role_policy = data.aws_iam_policy_document.apprunner_assume.json
}

data "aws_iam_policy_document" "apprunner_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals { type = "Service", identifiers = ["build.apprunner.amazonaws.com"] }
  }
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr" {
  role       = aws_iam_role.apprunner_ecr_access.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess-AWSElasticContainerRegistry"
}

# ---------------- GitHub OIDC (no AWS keys in CI) ----------------

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

data "aws_iam_policy_document" "gha_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals { type = "Federated", identifiers = [aws_iam_openid_connect_provider.github.arn] }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_owner}/${var.github_repo}:*"]
    }
  }
}

resource "aws_iam_role" "gha_role" {
  name               = "${var.project}-gha"
  assume_role_policy = data.aws_iam_policy_document.gha_assume.json
}

# Permissions: S3 sync, CloudFront invalidation, ECR push, App Runner update
resource "aws_iam_role_policy" "gha_policy" {
  name = "${var.project}-gha-policy"
  role = aws_iam_role.gha_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      { Effect = "Allow", Action = ["s3:*"], Resource = [
        aws_s3_bucket.web.arn, "${aws_s3_bucket.web.arn}/*"
      ]},
      { Effect = "Allow", Action = ["cloudfront:CreateInvalidation", "cloudfront:GetDistribution",
                                    "cloudfront:GetInvalidation", "cloudfront:ListDistributions"],
        Resource = "*" },
      { Effect = "Allow", Action = ["ecr:*"], Resource = "*" },
      { Effect = "Allow", Action = ["apprunner:StartDeployment",
                                    "apprunner:UpdateService",
                                    "apprunner:DescribeService",
                                    "apprunner:ListServices"], Resource = "*" },
      { Effect = "Allow", Action = ["sts:AssumeRole"], Resource = aws_iam_role.apprunner_ecr_access.arn }
    ]
  })
}
