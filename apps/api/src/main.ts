import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Drones Racing API")
    .setDescription("RESTFUL API for the drones Racing platform.")
    .setVersion("1.0")
    .addTag("drones-racing")
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, documentFactory);

  app.setGlobalPrefix("api/v1");
  app.enableCors({ origin: "http://localhost:4200", credentials: true });

  await app.listen(3000);
}
bootstrap();
