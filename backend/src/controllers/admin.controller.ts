import { Request, Response } from 'express';
import { adminService } from '../services';
import { successResponse } from '../utils/types';

export const adminController = {
  async getUsers(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;

    const result = await adminService.getUsers(page, limit, search);
    res.json(successResponse(result));
  },

  async getUserById(req: Request, res: Response) {
    const user = await adminService.getUserById(req.params.id);
    res.json(successResponse(user));
  },

  async updateUser(req: Request, res: Response) {
    const user = await adminService.updateUser(req.params.id, req.body);
    res.json(successResponse(user, 'User updated'));
  },

  async deleteUser(req: Request, res: Response) {
    await adminService.deleteUser(req.params.id);
    res.json(successResponse(null, 'User deleted'));
  },

  async getStats(req: Request, res: Response) {
    const stats = await adminService.getStats();
    res.json(successResponse(stats));
  },
};

export default adminController;
