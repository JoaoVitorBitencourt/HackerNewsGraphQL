import { arg, extendType, intArg, nonNull, objectType, stringArg } from "nexus";   
import { NexusGenObjects } from "../../nexus-typegen";  

export const Link = objectType({
    name: "Link", // <- Name of your type
    definition(t) {
        t.nonNull.int("id"); 
        t.nonNull.string("description"); 
        t.nonNull.string("url");
        t.field("postedBy", {   // 1
            type: "User",
            resolve(parent, args, context) {  // 2
                return context.prisma.link
                    .findUnique({ where: { id: parent.id } })
                    .postedBy();
            },
        });
    },
});

export const LinkQuery = extendType({  // 2
    type: "Query",
    definition(t) {
        t.nonNull.list.nonNull.field("feed", {   // 3
            type: "Link",
            resolve(parent, args, context, info) {    // 4
                return context.prisma.link.findMany();
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
                const newLink = context.prisma.link.create({   // 2
                    data: {
                        description: args.description,
                        url: args.url,
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