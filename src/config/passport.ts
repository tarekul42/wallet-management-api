import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { User } from "../modules/user/user.model.js";
import { assertUserActive } from "../utils/checkUserStatus.js";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";

passport.serializeUser((user: unknown, done) => {
  const u = user as { _id: Types.ObjectId };
  done(null, u._id.toString());
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

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

        try {
          assertUserActive(user);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Account is not active";
          return done(null, false, { message: msg });
        }
        if (!user.isVerified) {
          return done(null, false, { message: "Please verify your email" });
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
