import { Injectable, Logger } from '@nestjs/common';
import { Webhook } from 'svix';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users';

@Injectable()
export class WebhooksService {

  constructor(private configSer: ConfigService,
              private usersService: UsersService) {}
  private logger = new Logger()
  async handleUserCreated(request: any) {
    if (!process.env.WEBHOOK_SECRET){
      this.logger.error('WEBHOOK_SECRET is not defined in environment variables');
      return
    }
    const secret = process.env.WEBHOOK_SECRET;
    const wh = new Webhook(secret);

    const payload = request.rawBody.toString('utf8');
    const headers = request.headers;
    let msg;
    try {
      msg = wh.verify(payload, headers);
      console.log(msg);
      const formatedData = this.formatData(msg.data);
      await this.usersService.upsertByClerkId(msg.data.id, { ...formatedData });
    } catch (err) {
      console.error('Error verifying webhook:', err);
    }
  }

  formatData(data){
    return {
      firstName:data.first_name,
      lastName:data.last_name,
      avatarUrl: data.has_image ? data.image_url : null,
      email:data.email_addresses[0]?.email_address,
      clerkId:data.id
    }
  }

}
