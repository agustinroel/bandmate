import { getLibraryWork, listLibrary } from "./library.repo.js";
export async function libraryRoutes(app) {
    app.get("/library", async (_req, _reply) => {
        return listLibrary();
    });
    app.get("/library/:id", async (req, reply) => {
        const { id } = req.params;
        const data = await getLibraryWork(id);
        if (!data)
            return reply.code(404).send({ message: "Work not found" });
        return data;
    });
}
