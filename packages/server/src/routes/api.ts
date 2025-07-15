import express, { Router } from 'express';
import { collectionsRouter } from './collections';

export const apiRoutes: Router = express.Router();

apiRoutes.use('/collections', collectionsRouter);