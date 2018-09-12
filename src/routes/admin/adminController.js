import bcrypt from 'bcryptjs';
import { user, users } from '../../datastores/userData';

import checkRequired from '../../helpers/auth_field_helpers';

const userExists = username => Boolean(users.findByUsername(username));
const findUser = username => users.findByUsername(username);

const loginAdmin = (req, res) => {
  checkRequired(req, res);

  if (!userExists(req.body.username)) {
    res.status(401).json({
      success: false,
      message: `user ${req.body.username} not registered`
    });
  } else {
    const match = findUser(req.body.username);

    if (
      bcrypt.compareSync(req.body.password, match.password) &&
      match.isAdmin
    ) {
      user.details = { ...match };
      delete user.details.password;
      user.anonymous = false;

      res.status(200).json({
        success: true,
        message: `successful login as admin user`,
        user
      });
    }
  }
};

const logoutAdmin = (req, res) => {
  if (!req.user.anonymous) {
    delete user.details;
    user.anonymous = true;
    console.log(user);
    res.status(204).end();
  } else {
    res.status(200).json({
      success: true,
      message: `not logged in`
    });
  }
};

export default { loginAdmin, logoutAdmin };
