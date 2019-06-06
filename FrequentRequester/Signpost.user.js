// ==UserScript==
// @name         Signpost
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  DO NOT DELETE
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
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
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/5a349fca7cf32fac76d7bf5f48649f0dda273294/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["soundcloud.com","yelp.com","spokeo.com"];
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A1LQFK1LUBV6AK",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,p_caption,i)
    {
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"");
        my_query.name=my_query.name.replace("’","\'");
        console.log("b_name="+b_name+", my_query.name="+my_query.name);
        if(MTP.matches_names(b_name,my_query.name)) {
            console.log("matches names"); return false;
        }
        console.log("Here0");
       // if(i===0 && b_name.toLowerCase().indexOf(my_query.name.split(" ")[0].toLowerCase())!==-1) return false;
        console.log("Here1");

        if(i===0 && p_caption.toLowerCase().indexOf(my_query.name.toLowerCase())!==-1) return false;
        return true;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log(type+", b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.Phone) {
                my_query.fields.phone=parsed_context.Phone;
                my_query.fields.url=response.finalUrl;
            }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<5; i++) {
                console.log("i="+i);
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                try {
                    p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                }
                catch(error) { }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                b_factrow=b_algo[i].querySelector(".b_factrow");

                if(my_query.fields.phone.length===0 && !is_bad_name(b_name,p_caption,i) && b_factrow && type==="query") parse_b_factrow(b_name,b_url,b_factrow);
                if(!b1_success && type==="query" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) && !is_bad_name(b_name,p_caption,i) && (b1_success=true)) {
                    my_query.fields.url=b_url; }
                if(type==="fb" && !MTP.is_bad_fb(b_url) && !is_bad_name(b_name,p_caption,i) && (b1_success=true)) {
                    my_query.fb_url=b_url;
                    break;
                }
            }
            if(b1_success && (resolve("")||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(type==="query" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+" "+reverse_state_map[my_query.state], resolve, reject, query_response,"query");
            return;
        }

        if(type==="fb" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+" "+reverse_state_map[my_query.state]+" site:facebook.com", resolve, reject, query_response,"fb");
            return;
        }

        reject("Nothing found");
        return;
    }

    function parse_b_factrow(b_name,b_url,b_factrow) {
        console.log("In parse_b_factrow,b_url="+b_url);
        var el=b_factrow.querySelectorAll("li");
        var x;
        var re=/Phone:\s*(.*)$/,loc_re=/Location:\s*(.*)$/,match;
        for(x of el) {
            console.log("x.innerText="+x.innerText.trim());
            if((match=x.innerText.trim().match(re)) && my_query.fields.phone.length===0) {
                console.log("Match "+x.innerText.trim());
                my_query.fields.phone=match[1].trim();//.replace(/[^\d]*/g,"").replace(/^1/,"").trim();

                my_query.fields.url=b_url;
            }
        }

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }
    var call_contact_page=function(url,callback,extension) {
        console.log("in call_contact_page, url="+url+", extension="+extension);
        if(extension===undefined || extension==='') { extension='';
                                    }
        GM_xmlhttpRequest({method: 'GET', url: url,onload: function(response) {
            var doc = new DOMParser().parseFromString(response.responseText, "text/html");
            contact_response(doc,response.finalUrl,{extension:extension,callback:callback}); },
                           onerror: function(response) {
                               console.log("Fail");

                               MTurk.doneQueries++;
                               callback();
                           },
                           ontimeout: function(response) {
                               console.log("Fail timeout");
                               MTurk.doneQueries++;
                               callback(); }
                          });
    };
    /* If it's a good link to follow in the search for emails */
    function good_link_to_follow(l) {
        var contact_regex=/(Contact|(^About)|Legal|Team|Staff|Faculty|Teacher)/i,bad_contact_regex=/^\s*(javascript|mailto|tel):/i;

        if((contact_regex.test(l.innerText)||/\/(contact)/i.test(l.href))
                && !bad_contact_regex.test(l.href)) return true;
        if(MTP.get_domain_only(my_query.fields.url,true)===MTP.get_domain_only(l.href,true) && /^(Terms|Privacy)/.test(l.innerText)
           && !bad_contact_regex.test(l.href)) return true;
     //   console.log("l.innerText="+l.innerText);
        return false;
    }


    /**
 * contact_response Here it searches for an email TODO:FIX */
    var contact_response=function(doc,url,extra) {
        console.log("in contact_response,url="+url);

        var i,j, my_match,temp_email,encoded_match,match_split;
        var extension=extra.extension,callback=extra.callback,nlp_temp;
        var begin_email=my_query.fields.email,title_result;
        if(extension===undefined) extension='';

        var x,scripts=doc.scripts,style=doc.querySelectorAll("style");
        for(x=0;x<style.length;x++) { style[x].innerHTML=""; }


        console.log("in contact_response "+url);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|(^About)|Legal|Team|Staff|Faculty|Teacher)/i,bad_contact_regex=/^\s*(javascript|mailto|tel):/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url;

        if(my_query.fields.phone.length===0 && (phone_matches=doc.body.innerText.match(phone_re))) my_query.fields.phone=phone_matches[0];
        for(i=0; i < links.length; i++)
        {
            //console.log("i="+i+", text="+links[i].innerText);
            links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url)
            if(extension==='' && good_link_to_follow(links[i])
             &&
               !MTurk.queryList.includes(links[i].href)) {
                MTurk.queryList.push(links[i].href);
                console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                call_contact_page(links[i].href,callback,"NOEXTENSION");
                continue;
            }

            if(/^tel:/.test(links[i].href)) {
                my_query.fields.phone=links[i].href.replace(/^tel:\s*/,"").replace(/^\+\s*/,"").replace(/^1/,"")
                    .replace(/([\d]{3})([\d]{3})([\d]{4})/,"$1-$2-$3");
            }
            //if(email_re.test(temp_email) && !my_query.email_list.includes(temp_email)) my_query.email_list.push(temp_email);

        }
        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;
        callback();

        return;
    };

    function query_promise_then(result) {
        my_query.done.query=true;
        //my_query.fields.url=result;
        MTurk.queryList.push(result);
        call_contact_page(my_query.fields.url,submit_if_done);

        submit_if_done();

    }
    function fb_promise_then(result) {
      //  my_query.fb_url=result;
        my_query.fb_url=my_query.fb_url.replace(/m\.facebook\.com/,"www.facebook.com");
        my_query.fb_about_url=my_query.fb_url.replace(/(facebook\.com\/[^\/]+).*$/,"$1")
            .replace(/facebook\.com\//,"facebook.com/pg/").replace(/\/$/,"")+"/about/?ref=page_internal";
        console.log("my_query.fb_about_url="+my_query.fb_about_url);
        var fb_promise=MTP.create_promise(my_query.fb_about_url,MTP.parse_FB_about,parse_fb_about_then);
    }

    function parse_fb_about_then(result) {
        console.log("result="+JSON.stringify(result));
        my_query.done.fb=true;

        if(result.phone && my_query.fields.phone.length===0) {
            my_query.fields.phone=result.phone;
            my_query.fields.url=my_query.fb_url;
        }
        submit_if_done();
    }


    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function add_to_sheet() {
        var x,field;
        my_query.fields.phone=my_query.fields.phone.replace(/[^\d]+/g,"").replace(/^1/,"");
        var field_pos={"phone":0,"url":1};
        for(x in my_query.fields) {
            console.log("x="+x+", field_pos[x]="+field_pos[x]+", ");
            if((field=document.querySelectorAll("form input[type='text']")[field_pos[x]])) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        if(MTurk.queryList.length>0 && MTurk.doneQueries>=MTurk.queryList.length) {
            my_query.done.url=true; }
        //if(my_query.done.url && !my_query.found_fb) my_query.done.fb=true;
        console.log("my_query.done="+JSON.stringify(my_query.done)+"\ndoneQueries="+MTurk.doneQueries+", total="+MTurk.queryList.length);
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;

        console.log("is_done="+is_done+", MTurk.queryList.length="+MTurk.queryList.length);
        if(is_done && MTurk.doneQueries>=MTurk.queryList.length&&
           !my_query.submitted && (my_query.submitted=true)) {
            if(my_query.fields.url.length>0&&my_query.fields.phone.length>0) MTurk.check_and_submit();
            else {
                console.log("Insufficient info found, returning");
                GM_setValue("returnHit"+MTurk.assignment_id,true);
                return;
            }
        }
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        bad_urls=bad_urls.concat(default_bad_urls);
       // var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        var h3=document.querySelectorAll("h3");
        my_query={name,fields:{"url":"","phone":""},done:{"query":false,"fb":false,"url":false},submitted:false,
                 try_count:{"query":0,"fb":0}};
        h3.forEach(function(elem) {
            var match;
            if((match=elem.innerText.match(/Business Name \(U\.S\. city\/state\):\s*([^\(]*)\s+\(([^,]*),\s*([^\)]*)\)/))) {
                my_query.name=match[1];
                my_query.city=match[2];
                my_query.state=match[3];
            }

        });
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.city+" "+reverse_state_map[my_query.state];
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=true;
            my_query.done.url=true;
        submit_if_done();});
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:facebook.com", resolve, reject, query_response,"fb");
        });
        fbPromise.then(fb_promise_then)
            .catch(function(val) {
            console.log("Failed at this fbPromise " + val); my_query.done.fb=true;
            submit_if_done();
        });
    }

})();