from flask import Flask, render_template, jsonify, request
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime

app = Flask(__name__)

# MongoDB Connection (Local)
client = MongoClient('mongodb://localhost:27017/')
db = client['saas_subscription_db']
collection = db['subscriptions']

# Create database & collection if not exists
if 'saas_subscription_db' not in client.list_database_names():
    print("✅ New MongoDB Database Created: saas_subscription_db")

@app.route('/')
def index():
    return render_template('index.html')

# GET all + POST new
@app.route('/api/subscriptions', methods=['GET', 'POST'])
def subscriptions():
    if request.method == 'GET':
        subs = list(collection.find())
        for sub in subs:
            sub['_id'] = str(sub['_id'])
        return jsonify(subs)

    elif request.method == 'POST':
        data = request.get_json()
        data['created_at'] = datetime.utcnow()
        result = collection.insert_one(data)
        return jsonify({'_id': str(result.inserted_id)}), 201

# Single subscription (GET, UPDATE, DELETE)
@app.route('/api/subscriptions/<string:sub_id>', methods=['GET', 'PUT', 'DELETE'])
def subscription(sub_id):
    if request.method == 'GET':
        sub = collection.find_one({'_id': ObjectId(sub_id)})
        if sub:
            sub['_id'] = str(sub['_id'])
            return jsonify(sub)
        return jsonify({'error': 'Not found'}), 404

    elif request.method == 'PUT':
        data = request.get_json()
        result = collection.update_one(
            {'_id': ObjectId(sub_id)},
            {'$set': data}
        )
        if result.modified_count:
            return jsonify({'message': 'Updated successfully'})
        return jsonify({'error': 'Not found'}), 404

    elif request.method == 'DELETE':
        result = collection.delete_one({'_id': ObjectId(sub_id)})
        if result.deleted_count:
            return jsonify({'message': 'Deleted successfully'})
        return jsonify({'error': 'Not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)