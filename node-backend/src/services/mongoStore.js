const { MongoClient } = require("mongodb");

class MongoStore {
  constructor(uri, databaseName, collectionName) {
    this.uri = uri;
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.client = null;
    this.collection = null;
  }

  async connect() {
    if (this.collection) {
      return this.collection;
    }

    this.client = new MongoClient(this.uri);
    await this.client.connect();
    this.collection = this.client.db(this.databaseName).collection(this.collectionName);
    return this.collection;
  }

  async saveEvent(document) {
    const collection = await this.connect();
    const result = await collection.insertOne(document);
    return result.insertedId.toString();
  }

  async close() {
    if (!this.client) {
      return;
    }

    await this.client.close();
    this.client = null;
    this.collection = null;
  }
}

module.exports = {
  MongoStore
};