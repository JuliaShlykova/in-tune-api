require('dotenv').config();
const { faker } = require('@faker-js/faker');
const User = require('../models/User');
const Post = require('../models/Post');
const mongoose = require('mongoose');
const dbConnect = require('../configs/db.config');

const randomUser = () => {
  return {
    email: faker.internet.email(),
    password: faker.internet.password(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    profileInfo: {
      location: faker.location.city(),
      dateOfBirth: faker.date.birthdate({min: 18, max: 90, mode: 'age'}),
      occupation: faker.person.jobTitle(),
      hobbies: faker.person.bio(),
    }
  }
}

const randomPost = (authorId) => {
  return {
    text: faker.word.words({ count: { min: 10, max: 20 } }),
    author: authorId
  }
}

const populateDb = async () => {
  try {
    await dbConnect();
    const fakeUsers = faker.helpers.multiple(randomUser, {count: 10});
    await Promise.all(fakeUsers.map(async user => {
      const userDb = new User(user);
      console.log('new User: ', userDb);
      const fakePosts = faker.helpers.multiple(() => randomPost(userDb._id), { count: 5 });
      await Promise.all([...fakePosts.map(async post => {
        const postDb = new Post(post);
        console.log('new post by '+userDb.firstName+' '+userDb.lastName+': '+ postDb);
        return postDb.save();
      }), userDb.save()]);
    }))
  } catch(err) {
    console.log(err);
  } finally {
    mongoose.connection.close();
  }
}
populateDb();