import { Controller, Post, Req, Res, Next, UseGuards } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { expressHandler } from '@genkit-ai/express';
import { bargainChefFlow } from './bargainChefFlow';
import { genericFlow } from './genericFlow';
import { ClerkAuthGuard } from '../auth';
import { UtilService } from '../shared/util.service';

@Controller()
export class GenkitController {
  private readonly handleBargainChef = expressHandler(bargainChefFlow);
  private readonly handleGeneric = expressHandler(genericFlow);

  constructor(private readonly utilService: UtilService) {}

  @Post('bargainChefFlow')
  bargainChef(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.handleBargainChef(req, res, next);
  }

  @UseGuards(ClerkAuthGuard)
  @Post('genericFlow')
  generic(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    return this.handleGeneric(req, res, next);
  }

  @Post('eval/runSuite')
  evalGeneric() {
    return this.utilService.runEvalSuite();
  }
}
