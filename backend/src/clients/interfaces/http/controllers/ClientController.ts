import { Request, Response } from 'express';
import { CreateClientUseCase } from '../application/use-cases/CreateClientUseCase';
import { UpdateClientUseCase } from '../application/use-cases/UpdateClientUseCase';
import { SearchClientsUseCase } from '../application/use-cases/SearchClientsUseCase';
import { GetClientHistoryUseCase } from '../application/use-cases/GetClientHistoryUseCase';
import { AddInteractionUseCase } from '../application/use-cases/AddInteractionUseCase';
import { DefineCustomFieldUseCase } from '../application/use-cases/DefineCustomFieldUseCase';
import { DefineOutcomeCategoryUseCase } from '../application/use-cases/DefineOutcomeCategoryUseCase';
import {
  createClientSchema,
  updateClientSchema,
  searchClientsSchema,
  addInteractionSchema,
  defineCustomFieldSchema,
  defineOutcomeCategorySchema
} from './schemas/clientSchemas';

export class ClientController {
  constructor(
    private createClientUseCase: CreateClientUseCase,
    private updateClientUseCase: UpdateClientUseCase,
    private searchClientsUseCase: SearchClientsUseCase,
    private getClientHistoryUseCase: GetClientHistoryUseCase,
    private addInteractionUseCase: AddInteractionUseCase,
    private defineCustomFieldUseCase: DefineCustomFieldUseCase,
    private defineOutcomeCategoryUseCase: DefineOutcomeCategoryUseCase
  ) {}

  public createClient = async (req: Request, res: Response) => {
    try {
      const validatedData = createClientSchema.parse(req.body);
      const tenantId = req.tenant!.id;
      const authorUserId = req.user!.id;

      const client = await this.createClientUseCase.execute({
        tenantId,
        authorUserId,
        ...validatedData
      });

      res.status(201).json(client);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public updateClient = async (req: Request, res: Response) => {
    try {
      const validatedData = updateClientSchema.parse(req.body);
      const tenantId = req.tenant!.id;
      const updatingUserId = req.user!.id;
      const clientId = req.params.clientId;

      const client = await this.updateClientUseCase.execute({
        tenantId,
        clientId,
        updatingUserId,
        ...validatedData
      });

      res.status(200).json(client);
    } catch (error: any) {
      if (error.message === 'Client not found or access denied') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  };

  public searchClients = async (req: Request, res: Response) => {
    try {
      const validatedData = searchClientsSchema.parse(req.query);
      const tenantId = req.tenant!.id;

      const result = await this.searchClientsUseCase.execute({
        tenantId,
        filters: {
          name: validatedData.name,
          status: validatedData.status,
          assignedUserId: validatedData.assignedUserId,
          customFields: validatedData.customFields,
        },
        skip: validatedData.skip,
        take: validatedData.take,
      });

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getHistory = async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenant!.id;
      const clientId = req.params.clientId;

      const result = await this.getClientHistoryUseCase.execute({ tenantId, clientId });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  public addInteraction = async (req: Request, res: Response) => {
    try {
      const validatedData = addInteractionSchema.parse(req.body);
      const tenantId = req.tenant!.id;
      const clientId = req.params.clientId;
      const authorUserId = req.user!.id;

      const interaction = await this.addInteractionUseCase.execute({
        tenantId,
        clientId,
        authorUserId,
        ...validatedData
      });

      res.status(201).json(interaction);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  };

  public defineCustomField = async (req: Request, res: Response) => {
    try {
      const validatedData = defineCustomFieldSchema.parse(req.body);
      const tenantId = req.tenant!.id;
      const requestingUserRole = req.user!.role;

      const definition = await this.defineCustomFieldUseCase.execute({
        tenantId,
        requestingUserRole,
        ...validatedData
      });

      res.status(201).json(definition);
    } catch (error: any) {
      if (error.message.includes('Only Business Owners')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  };

  public defineOutcomeCategory = async (req: Request, res: Response) => {
    try {
      const validatedData = defineOutcomeCategorySchema.parse(req.body);
      const tenantId = req.tenant!.id;
      const requestingUserRole = req.user!.role;

      const category = await this.defineOutcomeCategoryUseCase.execute({
        tenantId,
        requestingUserRole,
        ...validatedData
      });

      res.status(201).json(category);
    } catch (error: any) {
      if (error.message.includes('Only Business Owners')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  };
}
