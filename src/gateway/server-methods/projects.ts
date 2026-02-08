import { ProjectManager } from "../../projects/project-manager.js";
import { defineServerMethod } from "./types.js";

export const projectsList = defineServerMethod({
  method: "projects.list",
  params: {},
  handler: async () => {
    return { projects: ProjectManager.getInstance().listProjects() };
  },
});

export const projectsAdd = defineServerMethod({
  method: "projects.add",
  params: {
    name: "string",
    description: "string",
  },
  handler: async (params) => {
    const project = ProjectManager.getInstance().addProject(params.name, params.description);
    return { project };
  },
});

export const projectsRemove = defineServerMethod({
  method: "projects.remove",
  params: {
    id: "string",
  },
  handler: async (params) => {
    const success = ProjectManager.getInstance().removeProject(params.id);
    return { success };
  },
});
