import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { UpdateUserInput } from "../interfaces/user.interface";
import { getPageInfo } from "../utils/getPageInfo";

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

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { filterModel, sortModel, startRow, endRow } = req.body;

    const { rowData, rowCount } = await UserService.getAllUsers({
      filterModel,
      sortModel,
      startRow,
      endRow,
    });

    const { pageSize, currentPage, totalPages } = getPageInfo(
      startRow,
      endRow,
      rowCount
    );

    res.status(200).json({
      success: true,
      errors: null,
      message: "Course retrieved successfully",
      data: {
        rows: rowData,
      },
      rowCount: rowCount,
      lastRow: rowCount,
      pageInfo: {
        startRow,
        endRow,
        pageSize,
        currentPage,
        totalPages,
      },
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
