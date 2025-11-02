import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { User } from "../modules/user/user.model";
import { IsActive } from "../modules/user/user.interface";
import bcrypt from "bcryptjs";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
          return done(null, false, { message: "User does not exists" });
        }
        if (!user.isVerified) {
          return done(null, false, { message: "Please verify your email" });
        }
        if (
          user.isActive === IsActive.BLOCKED ||
          user.isActive === IsActive.INACTIVE
        ) {
          return done(null, false, {
            message: `Your account is ${user.isActive}`,
          });
        }
        if (user.isDeleted) {
          return done(null, false, { message: "Your account is deleted" });
        }
        if (!user.password) {
          return done(null, false, {
            message: "Password not set, please reset your password",
          });
        }

        const isPasswordMatched = await bcrypt.compare(password, user.password);

        if (!isPasswordMatched) {
          return done(null, false, { message: "Password does not match" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);
