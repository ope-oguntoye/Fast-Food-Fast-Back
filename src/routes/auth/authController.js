import bcrypt from 'bcryptjs';
import User from '../../models/users';
import { user, users } from '../../datastores/userData';
import { ROOT_URL } from '../index';

const userExists = username => Boolean(users.findByUsername(username));
const findUser = username => users.findByUsername(username);

const createUser = (req, res) => {
  const errors = [];
  ['username', 'password'].map(field => {
    if (req.body[field] === undefined) {
      errors.push({
        category: 'validation',
        message: `misssing required ${field} field`
      });
    }
  });
  if (!/(.*)@(.*)\.(.*)/.test(req.body.email)) {
    errors.push({
      category: 'validation',
      message: 'invalid email format'
    });
  }

  if (!req.user.anonymous) {
    res.status(307).json({
      success: true,
      location: `${req.headers.host + ROOT_URL}/menu`,
      message: `already logged in as ${req.user.details.username}`
    });
  } else if (errors.length > 0) {
    res.status(400).json({
      success: false,
      errors
    });
  } else if (userExists(req.body.username)) {
    res.status(409).json({
      success: false,
      message: `user '${req.body.username}' already exists`
    });
  } else {
    const userToCreate = {
      username: req.body.username,
      password: req.body.password,
      email: req.body.email || ''
    };

    const newUser = new User(userToCreate);

    bcrypt.genSalt(10, (gErr, salt) => {
      if (gErr) {
        res.status(500).json({
          success: true,
          message: `An unexpected error occured, please try again`
        });
      } else {
        bcrypt.hash(newUser.password, salt, (hErr, hash) => {
          if (hErr) {
            res.status(500).json({
              success: true,
              message: `An unexpected error occured, please try again`
            });
          } else {
            newUser.password = hash;
            newUser.save();
          }
        });
      }
    });

    res.status(201).json({
      success: true,
      message: `user ${newUser.username} registered successfully`
    });
  }
};

const userLogin = (req, res) => {
  const errors = [];
  ['username', 'password'].map(field => {
    if (req.body[field] === undefined) {
      errors.push({
        category: 'validation',
        message: `misssing required ${field} field`
      });
    }
  });
  if (!req.user.anonymous) {
    res.status(307).json({
      success: true,
      location: `${req.headers.host + ROOT_URL}/menu`,
      message: `already logged in as ${req.user.details.username}`
    });
  } else if (errors.length > 0) {
    res.status(400).json({
      success: false,
      errors
    });
  } else if (!userExists(req.body.username)) {
    res.status(401).json({
      success: false,
      message: `user ${req.body.username} not registered`
    });
  } else {
    const match = findUser(req.body.username);

    if (bcrypt.compare(req.body.password, match.password)) {
      user.details = { ...match };
      user.anonymous = false;
      delete user.details.password;

      if (match.isAdmin) {
        res.status(200).json({
          success: true,
          message: `successful login as admin user`,
          user
        });
      } else {
        res.status(200).json({
          success: true,
          message: `successful login as ${req.user.details.username}`,
          user
        });
      }
    } else {
      res.status(400).json({
        success: true,
        message: `password incorrect`,
        user
      });
    }
  }
};

export default { createUser, userLogin };