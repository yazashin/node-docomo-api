var request = require('request');
var _ = require('underscore');
require('date-utils');

var DIALOGUE_URL = 'https://api.apigw.smt.docomo.ne.jp/dialogue/v1/dialogue?APIKEY=';
var KNOWLEDGEQA_URL = 'https://api.apigw.smt.docomo.ne.jp/knowledgeQA/v1/ask?APIKEY=';
var REPL_AI_URL = 'https://api.repl-ai.jp/v1/'

var Docomo = function(apiKey, replApiKey) {
    this.apiKey = apiKey;
    this.replApiKey = replApiKey;
};

module.exports = Docomo;

Docomo.prototype.createDialogue = function(utt, params, callback) {
    var client = this;
    var postURL = DIALOGUE_URL + client.apiKey;

    if ('function' === typeof params) {
        callback = params;
        params = undefined;
    }

    var defaultJson = {
        "utt": utt,
        "context": client.context,
        "mode": "dialog"
    };

    var requestJson = _.extend(defaultJson, params);

    request({
        uri: postURL,
        method: 'POST',
        json: requestJson
    }, function(error, response, body) {
        if (response.statusCode === 200) {
            client.context = body.context;
        } else {
            error = new Error(body);
        }
        callback(error, body || {});
    });
};

Docomo.prototype.createKnowledgeQA = function(q, callback) {
    var getURL = KNOWLEDGEQA_URL + this.apiKey + '&q=' + encodeURIComponent(q);

    request(getURL, function(error, response, body) {
        var body = JSON.parse(body);
        if (response.statusCode !== 200) {
            error = new Error(body);
        }
        callback(error, body || {});
    });
};

Docomo.prototype.createReplAiRegistration = function(botId, callback) {
    var headers = {
        'Content-Type': 'application/json',
        'x-api-key': this.replApiKey
    };

    request({
        uri: REPL_AI_URL + 'registration',
        method: 'POST',
        headers: headers,
        json: true,
        body: {
            'botId': botId
        }
    }, function(error, response, body) {
        if (response.statusCode === 200) {
            console.log("=== repl-ai response:200");
        } else {
            console.log("=== repl-ai response:other");
            console.log('error: ' + JSON.stringify(response));
            error = new Error(body);
        }
        console.log("=== repl-ai");
        console.log(JSON.stringify(response.headers.date));
        this.appRecvTime = response.headers.date;
        callback(error, body || {});
    });
};

Docomo.prototype.createReplAiDialogue = function(appUserId, botId, initTopicId, voiceText, appRecvTime, callback) {
    var requestHeaders = {
        'Content-Type': 'application/json',
        'x-api-key': this.replApiKey
    };

    var dt = new Date();
    var appSendTime = dt.toFormat("YYYY-MM-DD HH24:MI:SS");
console.log(appSendTime);
    // https://repl-ai.jp/references/dialogue.html
    var requestBody = {
        'appUserId': appUserId, //「ユーザID取得」で取得したユーザIDを指定
        'botId': botId, // マイプロジェクトのプロジェクト一覧/プロジェクト詳細画面に表示される「ボットID」
        'initTopicId': initTopicId,// マイプロジェクトのプロジェクト一覧/プロジェクト詳細画面に表示される「シナリオID」
        'voiceText': voiceText || "init",
        'initTalkingFlag': false,
        'appRecvTime': appRecvTime,
        'appSendTime': appSendTime
    };

    request({
        uri: REPL_AI_URL + 'dialogue',
        method: 'POST',
        headers: requestHeaders,
        json: true,
        body: requestBody
    }, function(error, response, body) {
        if (response.statusCode === 200) {
            console.log("=== repl-ai response:200");
        } else {
            console.log("=== repl-ai response:other");
            console.log('error: ' + JSON.stringify(response));
            error = new Error(body);
        }
        console.log(JSON.stringify(body));
        callback(error, body || {});
    });
};
