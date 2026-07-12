import { Controller, Post, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { expressHandler } from '@genkit-ai/express';
import { bargainChefFlow } from './bargainChefFlow';
import { genericFlow } from './genericFlow';

@Controller()
export class GenkitController {
  private readonly handleBargainChef = expressHandler(bargainChefFlow);
  private readonly handleGeneric = expressHandler(genericFlow);

  @Post('bargainChefFlow')
  bargainChef(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.handleBargainChef(req, res, next);
  }

  @Post('genericFlow')
  generic(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {

    return this.handleGeneric(req, res, next);
  }
}
