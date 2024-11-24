import z, { optional, string } from "zod"
export const createTaskInput = z.object({
    options : z.array(z.object({
        imageUrl : z.string()
    })),
    signature : z.string(),
    title  : z.string().optional()
})

export const createSubmissionInput = z.object({
    taskId : z.string(),
    selection : z.string()
})

export const singninput = z.object({
    publicKey : z.string(),
    signature : z.string()
})

