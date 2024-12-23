import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    role: { type: String, default: "user" }, // admin, user, moderator
    active: { type: Number, default: 0 }, // 0 -> deactive, 1 -> active, 2 -> disabled

    lastLogin: { type: Date, default: null },
    loginIp: { type: String, default: "" },

    permissions: { type: Array, default: [] }, // view, delete, update, role, permistions

    // password reset token
    token: { type: String, default: "" },
    tokenExp: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// remove password, token, tokenExp from response
userSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    delete ret.password;
    delete ret.tokenExp;
    delete ret.token;

    return ret;
  }
});

const User = mongoose.model("User", userSchema);
export default User