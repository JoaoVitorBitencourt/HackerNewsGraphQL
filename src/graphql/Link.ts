import { extendType, nonNull, objectType, stringArg, intArg, inputObjectType, enumType, arg, list } from "nexus";
import { NexusGenObjects } from "../../nexus-typegen";
import { Prisma } from "@prisma/client"  

export const Link = objectType({
    name: "Link", // <- Name of your type
    definition(t) {
        t.nonNull.int("id"); 
        t.nonNull.string("description"); 
        t.nonNull.string("url");
        t.nonNull.dateTime("createdAt");
        t.field("postedBy", {   // 1
            type: "User",
            resolve(parent, args, context) {  // 2
                return context.prisma.link
                    .findUnique({ where: { id: parent.id } })
                    .postedBy();
            },
        });
        t.nonNull.list.nonNull.field("voters", {  // 1
            type: "User",
            resolve(parent, args, context) {
                return context.prisma.link
                    .findUnique({ where: { id: parent.id } })
                    .voters();
            }
        });
    },
});

export const Feed = objectType({
    name: "Feed",
    definition(t) {
        t.nonNull.list.nonNull.field("links", { type: Link }); // 1
        t.nonNull.int("count"); // 2
    },
});

export const LinkOrderByInput = inputObjectType({
    name: "LinkOrderByInput",
    definition(t) {
        t.field("description", { type: Sort });
        t.field("url", { type: Sort });
        t.field("createdAt", { type: Sort });
    },
});

export const Sort = enumType({
    name: "Sort",
    members: ["asc", "desc"],
});


export const LinkQuery = extendType({  // 2
    type: "Query",
    definition(t) {
        t.nonNull.field("feed", {  // 1
            type: "Feed",
            args: {
                filter: stringArg(),   // 1
                skip: intArg(),   // 1
                take: intArg(),   // 1 
                orderBy: arg({ type: list(nonNull(LinkOrderByInput)) }),  // 1
            },
            async resolve(parent, args, context) { 
                const where = args.filter   // 2
                    ? {
                          OR: [
                              { description: { contains: args.filter } },
                              { url: { contains: args.filter } },
                          ],
                      }
                    : {};
                    
                    const links = await context.prisma.link.findMany({  
                        where,
                        skip: args?.skip as number | undefined,
                        take: args?.take as number | undefined,
                        orderBy: args?.orderBy as
                            | Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput>
                            | undefined,
                    });
    
                    const count = await context.prisma.link.count({ where });  // 2
    
                    return {  // 3
                        links,
                        count,
                    };
            },
        });
        t.nonNull.field("getLink", {   // 3
            type: "Link",
            args: {   // 3
                id: nonNull(intArg())
            },
            resolve(parent, args, context, info) {    // 4
                return context.prisma.link.findUnique({
                    where: {
                        id: args.id
                    }
                });
            },
        });
    },
});

export const LinkMutation = extendType({  // 1
    type: "Mutation",    
    definition(t) {
        t.nonNull.field("post", {  // 2
            type: "Link",  
            args: {   // 3
                description: nonNull(stringArg()),
                url: nonNull(stringArg()),
            },
            resolve(parent, args, context) {    
                const { description, url } = args;
                const { userId } = context;

                if (!userId) {  // 1
                    throw new Error("Cannot post without logging in.");
                }

                const newLink = context.prisma.link.create({
                    data: {
                        description,
                        url,
                        postedBy: { connect: { id: userId } },  // 2
                    },
                });

                return newLink;
            },
        });

        t.nonNull.field("refresh", {  // 2
            type: "Link",  
            args: {   // 3
                id: nonNull(intArg()),
                description: nonNull(stringArg()),
                url: nonNull(stringArg()),
            },
            resolve(parent, args, context) {    
                const updateLink = context.prisma.link.update({
                    where: {
                        id: args.id
                    },
                    data: {
                        description: args.description,
                        url: args.url
                    }
                });

                return updateLink;
            },
        });

        t.nonNull.field("deleteLink", {
            type: "Link",
            args: {
                id: nonNull(intArg())
            },
            resolve (parent, args, context) {
                const deleteLink = context.prisma.link.delete({
                    where: {
                        id: args.id
                    }
                });

                return deleteLink;
            }
        })
    },
});