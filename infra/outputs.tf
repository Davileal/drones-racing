output "web_bucket" { value = aws_s3_bucket.web.bucket }
output "cloudfront_domain" { value = aws_cloudfront_distribution.web.domain_name }
output "ecr_repo_url" { value = aws_ecr_repository.api.repository_url }
output "apprunner_url" { value = aws_apprunner_service.api.service_url }
output "gha_role_arn" { value = aws_iam_role.gha_role.arn }
