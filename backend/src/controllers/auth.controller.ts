import { Request, Response } from 'express';
import { authService } from '../services';
import { successResponse } from '../utils/types';
import { AuthenticatedRequest } from '../utils/types';

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    res.status(201).json(successResponse(result, 'Account created successfully'));
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    res.json(successResponse(result, 'Login successful'));
  },

  async me(req: AuthenticatedRequest, res: Response) {
    const user = await authService.getProfile(req.user!.id);
    res.json(successResponse(user));
  },

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    const user = await authService.updateProfile(req.user!.id, req.body);
    res.json(successResponse(user, 'Profile updated'));
  },

  async changePassword(req: AuthenticatedRequest, res: Response) {
    await authService.changePassword(req.user!.id, req.body);
    res.json(successResponse(null, 'Password changed successfully'));
  },

  async forgotPassword(req: Request, res: Response) {
    await authService.forgotPassword(req.body.email);
    res.json(successResponse(null, 'If an account exists, a reset email has been sent'));
  },

  async resetPassword(req: Request, res: Response) {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json(successResponse(null, 'Password reset successful'));
  },

  async logout(req: AuthenticatedRequest, res: Response) {
    // With JWT, logout is handled client-side by removing the token
    // Optionally, you could blacklist the token here
    res.json(successResponse(null, 'Logged out successfully'));
  },
};

export default authController;
