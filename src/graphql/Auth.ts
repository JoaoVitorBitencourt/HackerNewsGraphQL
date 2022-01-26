import { objectType, extendType, nonNull, stringArg } from "nexus";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { APP_SECRET } from "../utils/auth";

export const AuthPayload = objectType({
    name: "AuthPayload",
    definition(t) {
        t.nonNull.string("token");
        t.nonNull.field("user", {
            type: "User",
        });
    },
});

export const AuthMutation = extendType({
    type: "Mutation",
    definition(t) {
        t.nonNull.field("signup", { // 1
            type: "AuthPayload",  
            args: {  
                email: nonNull(stringArg()), 
                password: nonNull(stringArg()),
                name: nonNull(stringArg()),
            },
            async resolve(parent, args, context) {
                const { email, name } = args;
                // 2
                const password = await bcrypt.hash(args.password, 10);

                // 3
                const user = await context.prisma.user.create({
                    data: { email, name, password },
                });

                // 4
                const token = jwt.sign({ userId: user.id }, APP_SECRET);

                // 5
                return {
                    token,
                    user,
                };
            },
        });
    },
});