- Get all profils and order them by ratio (nbTweets / retweet)

db.getCollection('profil').aggregate([
    { $match: { retweetCount: {$gt : 0 } } },
    { $project:
        {
            screen_name:1,
            id: 1,
            ratio: { $divide: ['$scoreByTopic', '$retweetCount' ] }
        }
    },
    {$sort: {ratio: -1}}
])

- Get all tweets that were not profiled

db.getCollection('tweet').find({
    $or : [
        { profiled: {$exists: false} },
        { profiled : { $eq: false } }
    ]
})
