// ==UserScript==
// @name         MichaelCoupe
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["facebook.com","local.yahoo.com","youtube.com","twitter.com","yelp.com"];
    var MTurk=new MTurkScript(20000,200,[],init_Query,"A39GWSBSSA2V6G");
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,p_caption)
    {
        var reg=/[-\s\'\"]+/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        if(p_caption.match(my_query.address)) return false;
        return true;
    }

    function is_bad_fb(b_url,b_name)
    {
        if(/\/(pages|groups)\//.test(b_url)) return true;
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parse_context,parse_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");

            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            if(b_context) {
                parse_context=MTP.parse_b_context(b_context);
                if(doc.getElementById("permanentlyClosedIcon")) {
                    document.getElementsByName("Q6MultiLineTextInput")[0].value="Permanently closed"; }
                if(parse_context && parse_context.Website && parse_context.Website!==undefined && !MTP.is_bad_url(parse_context.Website,bad_urls,5)) {
                  //  console.log("Found in b_context: "+parse_context.Website);
                    resolve(parse_context.Website);
                    return;
                }
            }
            if(lgb_info && (parse_lgb=MTP.parse_lgb_info(lgb_info)) && parse_lgb.url && parse_lgb.url!==undefined  &&
              !MTP.is_bad_url(parse_lgb.url,bad_urls,5)) {
                resolve(parse_lgb.url);
                return;
            }
            console.log("b_algo.length="+b_algo.length);
            for(i=0; i < b_algo.length && i < 4; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log(type+":("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(b_url!==undefined && !(type==="url" && MTurkScript.prototype.is_bad_url(b_url, bad_urls)) &&
                   !(type==="fb" && is_bad_fb(b_url,b_name))

                   && !is_bad_name(b_name,p_caption))
                {
                    b1_success=true;
                    break;

                }

            }
            if(b1_success)
            {
                /* Do shit */
                resolve(b_url);
                return;
            }
        }
        catch(error)
        {
            reject(error);
            return;
        }
        if(type==="fb" && my_query.fb_try_count===0) {
            my_query.fb_try_count++;
            query_search("+\""+my_query.name+"\" "+my_query.address+" site:facebook.com",resolve,reject,query_response,type);
            return;
        }
        if(type==="fb" && my_query.fb_try_count===1) {
            my_query.fb_try_count++;
            query_search(my_query.name+" site:facebook.com",resolve,reject,query_response,type);
            return;
        }
        if(type==="url" && my_query.try_count===0) {
            my_query.try_count++;
            query_search("+\""+my_query.name+"\" "+my_query.address,resolve,reject,query_response,type);
            return;
        }
        if(type==="url" && my_query.try_count===1) {
            my_query.try_count++;
            query_search(my_query.name,resolve,reject,query_response,type);
            return;
        }
        reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("Found url="+result+", calling");
        call_contact_page(result,submit_if_done);
    }

    function fb_promise_then(result) {
        var url=result.replace(/facebook\.com\/([^\/]+).*$/,"facebook.com/pg/$1").replace(/\/$/,"")+"/about/?ref=page_internal";
        console.log("FB promise_then, new url="+url);
        var promise=MTP.create_promise(url,MTP.parse_FB_about,parse_fb_about_then);

    }

    function parse_fb_about_then(result) {
        console.log("result="+JSON.stringify(result));
        my_query.done["fb"]=true;
        if(result.team.length>0) {
            var fullname=MTP.parse_name(result.team[0]);
            my_query.fields["first name"]=fullname.fname;
            my_query.fields["last name"]=fullname.lname;
        }
        if(result.email) {
            my_query.fields.email=result.email;
            my_query.done["url"]=true;
        }

        else if(result.url) query_promise_then(result.url);
        else
        {
            var search_str="+\""+my_query.name+ "\" "+my_query.address+" "+my_query.phone;
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str, resolve, reject, query_response,"url");
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                my_query.done["url"]=true;
                submit_if_done();
                console.log("Failed at this queryPromise " + val); });
        }

        submit_if_done();
    }

    function begin_script(timeout,total_time,callback) {
        if(MTurk!==undefined) { callback(); }
        else if(total_time<5000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function add_to_sheet() {
        var field_name_map={"email":"Email","url":"ContactInfoPage"};
        var x,field,match;
        if(my_query.fields.email&&my_query.fields.email.length>0)  {
            console.log("*** my_query.fields.email="+my_query.fields.email);
            my_query.fields.email=my_query.fields.email.toString().replace(/^20([a-z]+)/,"$1"); }
        if(my_query.fields.email && (match=my_query.fields.email.toLowerCase().match(/^([a-z]{2,})\.([a-z]{3,})/))) {
            my_query.fields["first name"]=match[1];
            my_query.fields["last name"]=match[2];
        }
        for(x in my_query.fields) {
            if(document.getElementById(x) && my_query.fields[x].length>0) {
                document.getElementById(x).value=my_query.fields[x];
            
            }
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
         if(MTurk.queryList.length>0 && MTurk.doneQueries>=MTurk.queryList.length) {
            my_query.done["url"]=true; }
        console.log("my_query="+JSON.stringify(my_query)+"\ndoneQueries="+MTurk.doneQueries+", total="+MTurk.queryList.length);
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;

        console.log("is_done="+is_done+", MTurk.queryList.length="+MTurk.queryList.length);
        if(is_done && MTurk.doneQueries>=MTurk.queryList.length&&
           !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    var call_contact_page=function(url,callback,extension) {
        console.log("in call_contact_page, url="+url+", extension="+extension);
        if(extension===undefined || extension==='') { extension='';
                                   MTurk.queryList.push(url); }
        GM_xmlhttpRequest({method: 'GET', url: url,onload: function(response) {
            var doc = new DOMParser().parseFromString(response.responseText, "text/html");
            contact_response(doc,response.finalUrl,{extension:extension,callback:callback}); },
                           onerror: function(response) { console.log("Fail");
                                                        MTurk.doneQueries++;
                                                        callback(); },
                           ontimeout: function(response) { console.log("Fail timeout");
                                                          MTurk.doneQueries++;
                                                          callback(); }
                          });
    };


    /**
 * contact_response Here it searches for an email TODO:FIX */
    var contact_response=function(doc,url,extra) {
        console.log("in contact_response,url="+url);
        var i,j, my_match,temp_email,encoded_match,match_split;
        var extension=extra.extension,callback=extra.callback;
        var begin_email=my_query.fields.email;
        if(extension===undefined) extension='';

        console.log("in contact_response "+url);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|About|Legal|Team|Coach)/i,bad_contact_regex=/^\s*(javascript|mailto):/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        doc.body.innerHTML=doc.body.innerHTML.replace(/\s*\[at\]\s*/,"@").replace(/\s*\[dot\]\s*/,".");
        if(email_matches=doc.body.innerHTML.match(email_re)) {
            for(j=0; j < email_matches.length; j++) {
                if(!MTurk.is_bad_email(email_matches[j]) && email_matches[j].length>0 &&
                   (my_query.fields.email=email_matches[j])) break;
            }
            console.log("Found email hop="+my_query.fields.email);
        }
        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
        for(i=0; i < links.length; i++)
        {

             //console.log("i="+i+", text="+links[i].innerText);
            if(extension==='' && contact_regex.test(links[i].innerText) && !bad_contact_regex.test(links[i].href) &&
               !MTurk.queryList.includes(links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url)))
            {
                MTurk.queryList.push(links[i].href);
                console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                call_contact_page(links[i].href,callback,"NOEXTENSION");
                continue;
            }
            if(links[i].dataset.encEmail && (temp_email=MTurkScript.prototype.swrot13(links[i].dataset.encEmail.replace(/\[at\]/,"@")))
               && !MTurkScript.prototype.is_bad_email(temp_email)) my_query.fields.email=temp_email;
            if(links[i].href.indexOf("amazonaws.com")===-1 && links[i].href.indexOf("mturkcontent.com")===-1)
            {
                //    console.log(short_name+": ("+i+")="+links[i].href);
            }
            if(links[i].href.indexOf("cdn-cgi/l/email-protection#")!==-1 && (encoded_match=links[i].href.match(/#(.*)$/)) &&
               (temp_email=MTurkScript.prototype.cfDecodeEmail(encoded_match[1]).replace(/\?.*$/,"")) &&
               !MTurkScript.prototype.is_bad_email(temp_email)) my_query.fields.email=temp_email;
            if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(email_re)) &&
               !MTurkScript.prototype.is_bad_email(temp_email)) my_query.fields.email=temp_email;
            if(links[i].href.indexOf("javascript:location.href")!==-1 && (temp_email="") &&
               (encoded_match=links[i].href.match(/String\.fromCharCode\(([^\)]+)\)/)) && (match_split=encoded_match[1].split(","))) {
                for(j=0; j < match_split.length; j++) temp_email=temp_email+String.fromCharCode(match_split[j].trim());
                my_query.fields.email=temp_email;
            }
            if(links[i].href.indexOf("javascript:DeCryptX(")!==-1 &&
               (encoded_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/))) my_query.fields.email=MTurkScript.prototype.DecryptX(encoded_match[1]);
            if(/^tel:/.test(links[i].href)) my_query.fields.phoneNumber=links[i].href.replace(/^tel:/,"");
            if(/instagram\.com/.test(links[i].href) && my_query.done["insta"]===undefined) {
                my_query.done["insta"]=false;
                console.log("***** FOUND INSTAGRAM "+links[i].href);
                var temp_promise=MTP.create_promise(links[i].href,MTP.parse_instagram,parse_insta_then); }
        }
        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;
        //add_to_sheet();
        //submit_if_done();
        if(begin_email.length===0 && my_query.fields.email.length>0) my_query.fields.url=url;
        callback();
        return;
    };

    function parse_insta_then(result) {
        console.log("insta_result="+JSON.stringify(result));
        if(result.email) { my_query.fields.email=result.email; }
        my_query.done["insta"]=true;
        submit_if_done();
    }

    function begin_search() {

        var fb_str="+\""+my_query.name+"\" "+my_query.address+" "+my_query.phone+" site:facebook.com";
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning FB search");
            query_search(fb_str, resolve, reject, query_response,"fb");
        });
        fbPromise.then(fb_promise_then)
            .catch(function(val) {
            console.log("Failed at this fbPromise " + val);
            my_query.done["fb"]=true;
            var search_str=my_query.name+ " "+my_query.address+" "+my_query.phone;
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(search_str, resolve, reject, query_response,"url");
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                my_query.done["url"]=true;
                submit_if_done();
                console.log("Failed at this queryPromise " + val); });
            submit_if_done();
        });

    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var form=document.getElementById("mturk_form");
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:wT.rows[0].cells[1].innerText,address:wT.rows[1].cells[1].innerText,
                  phone:wT.rows[2].cells[1].innerText,fb_try_count:0,try_count:0,
                  fields:{email:"","first name":"","last name":""},done:{fb:false,url:false},submitted:false};

        begin_script(200,0,begin_search);

    }

})();