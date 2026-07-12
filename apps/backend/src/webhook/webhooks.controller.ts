import { Body, Controller, Post, RawBodyRequest, Req } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhookService: WebhooksService) {}

  @Post('clerk')
  handleClerkWebhook(@Req() request: RawBodyRequest<Request>) {
    return this.webhookService.handleUserCreated(request);
  }
}
