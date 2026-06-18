import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../modules/user/user.model";
import { IsActive, Role } from "../modules/user/user.interface";
import bcrypt from "bcryptjs";
import { envVars } from "./env";
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

if (envVars.GOOGLE_CLIENT_ID && envVars.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: envVars.GOOGLE_CLIENT_ID,
        clientSecret: envVars.GOOGLE_CLIENT_SECRET,
        callbackURL: envVars.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"), undefined);
          }

          let user = await User.findOne({ email });

          if (!user) {
            user = await User.create({
              name: profile.displayName,
              email,
              role: Role.USER,
              isVerified: true,
              isActive: IsActive.ACTIVE,
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      },
    ),
  );
}
