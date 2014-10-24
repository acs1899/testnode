var eventproxy = require('eventproxy'),
    cheerio = require('cheerio'),
    superagent = require('superagent'),
    express = require('express'),
    async = require('async'),
    url = require('url'),
    fs = require('fs'),
    site = require('./config');



function fetchUrl($url,$title,$post){
    superagent.get($url).end(function(err,res){
        if(err){return console.log(err)}
        var topicUrls = [],
            $ = cheerio.load(res.text),
            count = 0,
            posts = [];
        $($title).each(function(i,v){
            posts.push({
                'title':$(v).text(),
                'url':url.resolve($url,$(v).attr('href'))
            });
            var urlc = url.parse(posts[posts.length-1]['url']);
            posts[posts.length-1]['name'] = urlc.host+'_'+urlc.query;
        });
        async.mapLimit(posts,5,function(_post,callback){
            var t4 = new Date();
            count++;
            console.log('并发数'+count);
            superagent.get(_post['url']).end(function(err,res){
                var t5 = new Date(),
                    $ = cheerio.load(res.text),
                    content = $($post).html();
                count--;
                console.log('请求URL:'+_post['url']+'耗时：'+(t5-t4));
                _post['content'] = unescape(content.replace(/&#x/g,'%u').replace(/;/g,''));
                fs.open('./post/'+_post['name']+'.txt','w',0644,function(e,fd){
                    if(e) throw e;
                    fs.write(fd,_post['content'],0,'utf8',function(e){
                        if(e) throw e;
                        fs.closeSync(fd);
                    });
                });
                callback();/*必须调用callback,否则无法继续请求*/
            });
        },function(err,result){
            console.log('请求完成');
        });
    });
}
fetchUrl(site[0]['url'],site[0]['title'],site[0]['post']);
