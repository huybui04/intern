import { Request, Response } from "express";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "../shared/constants";
import { IPagination } from "../interfaces/pagination.interface";
import { UserService } from "../services/user.service";
import { UpdateUserInput, UserRole } from "../interfaces/user.interface";
import { IFilter } from "../interfaces/filter.interface";
import { ISort } from "../interfaces/sort.interface";

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let filters: IFilter[] = [];
    let sorts: ISort[] = [];
    let page = DEFAULT_PAGE;
    let pageSize = DEFAULT_PAGE_SIZE;

    if (req.query.filters) {
      try {
        filters = JSON.parse(req.query.filters as string);
      } catch (e) {
        res.status(400).json({ message: "Invalid filters format" });
        return;
      }
    }
    if (req.query.sorts) {
      try {
        sorts = JSON.parse(req.query.sorts as string);
      } catch (e) {
        res.status(400).json({ message: "Invalid sorts format" });
        return;
      }
    }
    if (req.query.page)
      page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    if (req.query.pageSize)
      pageSize = parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE;

    const pagination: IPagination = { page, pageSize };
    const { data, totalCount } = await UserService.getAllUsers(
      filters,
      sorts,
      pagination
    );
    res.status(200).json({
      message: "Users retrieved successfully",
      data,
      totalCount,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: UpdateUserInput = req.body;

    const updatedUser = await UserService.updateUser(id, updates);

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await UserService.deleteUser(id);

    if (!deleted) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const updateUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const updatedUser = await UserService.updateUserRole(id, role);

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    await UserService.changePassword(id, newPassword);
    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(400).json({
      message: error instanceof Error ? error.message : "Bad request",
    });
  }
};
