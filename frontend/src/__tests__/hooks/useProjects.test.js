import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useProjects,
  useMyProjects,
  useCreateProject,
} from "../../hooks/useProjects";
import marketplaceApi from "../../api/marketplaceApi";

jest.mock("../../api/marketplaceApi");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useProjects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should fetch all projects", async () => {
    const mockProjects = [
      { id: 1, title: "Project 1", status: "open" },
      { id: 2, title: "Project 2", status: "open" },
    ];

    marketplaceApi.getAllProjects.mockResolvedValue({ data: mockProjects });

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProjects);
  });

  test("should handle error when fetching projects", async () => {
    const error = new Error("Failed to fetch");
    marketplaceApi.getAllProjects.mockRejectedValue(error);

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe("useMyProjects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should fetch user projects", async () => {
    const mockProjects = [{ id: 1, title: "My Project 1", status: "open" }];

    marketplaceApi.getMyProjects.mockResolvedValue({ data: mockProjects });

    const { result } = renderHook(() => useMyProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProjects);
  });
});

describe("useCreateProject", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create a project", async () => {
    const newProject = {
      title: "New Project",
      description: "New Description",
      budgetMin: 100,
      budgetMax: 500,
    };

    marketplaceApi.createProject.mockResolvedValue({
      data: { id: 1, ...newProject },
    });

    const { result } = renderHook(() => useCreateProject(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newProject);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ id: 1, ...newProject });
  });
});
