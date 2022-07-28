// ==UserScript==
// @name       AdvancedPayData
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.facebook.com/*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @grant GM_cookie
// @grant GM.cookie
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/87bbbec009460d3330c174d120eb4aa5745a79a6/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(60000,750+(Math.random()*1000),[],begin_script,"A1NMLY3SPE09QH",true);
    console.log("window.location.href=",window.location.href);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

       /* Extra has some kinda of type field and a depth field indicating the depth */
    Address.scrape_address=function(doc,url,resolve,reject,extra) {

        let names=MTurkScript.prototype.find_company_name_on_website(doc,url);
        console.log("*** names=",names);
        if((!my_query.fields.office1_name||my_query.fields.office1_name.trim().length===0) && names.length>0) {
            my_query.fields.office1_name=names[0].name;
            add_to_sheet();
        }
        var type=extra.type,depth=extra.depth,links=doc.links,i,promise_list=[];



        Address.debug=extra.debug;
        var contact_regex=/(Contact|Location|Privacy|Kontakt|About)/i,bad_contact_regex=/^\s*(javascript|mailto):/i,contact2_regex=/contact[^\/]*/i;
        // if(/^(404|403|503|\s*Error)/i.test(doc.title) || /\?reqp\=1&reqr\=/.test(url)) my_query.failed_urls+=2;
        console.log("In scrape_address for type="+type+", url="+url);



        if(depth===0) {
            for(i=0; i < links.length; i++) {
                links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
                if((contact_regex.test(links[i].innerText) || contact2_regex.test(links[i].href))
                   && !bad_contact_regex.test(links[i].href) &&
                   !Address.queryList.includes(links[i].href) && Address.queryList.length<10) {
                    Address.queryList.push(links[i].href);
                    console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                    promise_list.push(MTP.create_promise(links[i].href,Address.scrape_address_page,function(result) {
                         },MTP.my_catch_func,type));
                    continue;
                }
                else if((contact_regex.test(links[i].innerText) || contact2_regex.test(links[i].href))) {
                    console.log("Link labeled "+links[i].innerText+" to "+links[i].href+" not followed");
                }
            }
        }
        // scrape this page
        promise_list.push(new Promise((resolve1,reject1) => {
            Address.scrape_address_page(doc,url,resolve1,reject1,type);
        }).then(MTP.my_then_func).catch(MTP.my_catch_func));
        Promise.all(promise_list).then(function(result) {
            resolve(names); })
            .catch(function(result) { if(Address.debug) console.log("Done all promises in scrape_address for "+type);
                                     if(Address.debug) console.log("&& my_query.address_str_list="+JSON.stringify(Address.addressStrList));
                                     resolve(""); });
    };

         if(/\.facebook\.com/.test(window.location.href)) {
        GM_addValueChangeListener("facebook",function() {
            console.log("arguments=",arguments);
            window.location.href=arguments[2].url;
        });

        setTimeout(parse_FB,2500);

    }

    function parse_FB() {
        console.log("parse FB");
        var result={};
        let name=document.querySelector(".k4urcfbm h2 > span > span");
        if(name) result.name=name.innerText.trim();
        result.address=document.querySelector("a[href*='google.com']")?document.querySelector("a[href*='google.com']").innerText.trim():"";

        var good_fields=document.querySelectorAll(".rq0escxv.l9j0dhe7.du4w35lb.j83agx80.cbu4d94t.d2edcug0.hpfvmrgz.rj1gh0hx.buofh1pr.g5gj957u.o8rfisnq.p8fzw8mz.pcp91wgn.iuny7tx3.ipjc6fyt");
        var curr_field;
        for(curr_field of good_fields) {
            if(/Follow This/i.test(curr_field.innerText)) {
                        result.followers=curr_field.innerText.trim().replace(/^([\d,]*).*$/,"$1").replace(/,/g,"");
            }
            if(phone_re.test(curr_field.innerText)) {
                result.phone=curr_field.innerText.trim();
            }
            let mail=curr_field.querySelector("a[href^='mailto']");
            if(mail) {
                result.email=mail.innerText.trim();
            }

        }



        var url=document.querySelector(".o8rfisnq span.py34i1dx > a[href*='.php']")?document.querySelector(".o8rfisnq span.py34i1dx > a[href*='.php']"):"";
        result.url=url?url.href:"";
        result.url=decodeURIComponent(result.url.replace("https://l.facebook.com/l.php?u=","")).replace(/\?fbclid\=.*$/,"");
        console.log("result=",result);
        result.date=Date.now();
        GM_setValue("result",result);

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
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); 
				if(parsed_context.Title) my_query.fields.brandName=parsed_context.Title.replace(/✕.*$/,"");
                if(parsed_context.Phone && !my_query.fields.brandPhone) my_query.fields.brandPhone=parsed_context.Phone;
                if(parsed_context.Address && !my_query.fields.brandLocation) {
                    let add=new Address(parsed_context.Address);
                    if(add && add.city && add.state) {
                        my_query.fields.brandLocation=add.city+", "+add.state;
                    }
                }
				if(type==="query" && parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                resolve(parsed_context.url);
                return;
            }
				} 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); 
					if(type==="query" && parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
                resolve(parsed_lgb.url);
                return;
            }
					
					}
            for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="query" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls) &&
                   (b_url.indexOf(my_query.name+".")!==-1 || !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i))
		   && (b1_success=true)) break;
                if(type!=="query" && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i) && !/\/hashtag\/|\/tags\//.test(b_url)
		   && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        reject("Nothing found");
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type,filters) {
        console.log("Searching with bing for "+search_str);
        if(!filters) filters="";
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&filters="+filters+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.fields.brandSite=result;
        var promise=MTP.create_promise(result,parse_website,parse_website_then,function() { GM_setValue("returnHit",true); });
        var promise2=MTP.create_promise(result,Gov.init_Gov,parse_gov_then,function() { my_query.done.gov=true; submit_if_done(); },{dept_regex_lst:[/Staff/],title_regex_lst:[/Owner/,/Manager/]});
    }

    function parse_gov_then(result) {
        if(Gov.email_list.length>0) {
            my_query.fields.brandEmail=Gov.email_list[0].email;
        }
        if(!my_query.fields.brandPhone && Gov.phone) my_query.fields.brandPhone=Gov.phone;
        my_query.done.gov=true;
        submit_if_done();
    }

    function parse_website(doc,url,resolve,reject) {
        var l;
        var names=MTP.find_company_name_on_website(doc,url,false);
        if(names.length>0&&!my_query.fields.brandName) {
            my_query.fields.brandName=names[0].name;
        }
        for(l of doc.links) {
            if(/instagram\.com/.test(l.href) && !MTP.is_bad_instagram(l.href)) my_query.fields.brandInstagram=l.href;
            if(/facebook\.com/.test(l.href) && !MTP.is_bad_fb(l.href)) my_query.fields.brandFacebook=l.href;
            if(/twitter\.com/.test(l.href) && !MTP.is_bad_twitter(l.href)) my_query.fields.brandTwitter=l.href;
           // console.log("l.href=",l.href);
        }
        console.log("LOGO, url=",url);
         var logo_list=doc.querySelectorAll("img[id*='logo' i],img[src*='logo' i],img[data-src*='logo' i],img[class*='logo' i],img[alt*='logo' i],.logo img,[id*='logo'] img");
        var logo="";
        var curr;
        for(curr of logo_list) {
            console.log("curr=",curr);
            if(/^data:/.test(curr.src)&&curr.dataset&&curr.dataset.src) curr.src=curr.dataset.src;
            if(curr.src&&!/^data:/.test(MTP.fix_remote_url(curr.src,url))) {
                logo=MTP.fix_remote_url(curr.src,url);
                break;
            }
        }
        if(logo) my_query.fields.brandLogo=logo;
        else {
            let meta=doc.querySelector("meta[property='og:image']");
            if(meta) my_query.fields.brandLogo=meta.content;
        }
        Address.scrape_address(doc,url,resolve,reject,{type:"",depth:0});
    }

    function parse_website_then(result) {
        console.log("* Address.addressList=",Address.addressList);
         Address.addressList.sort(function(a,b) { return a.priority-b.priority; });
        if(Address.addressList.length>0){
            let add=Address.addressList[0];
            console.log("* add=",add);
            if(add.city && add.state) {
                my_query.fields.brandLocation=add.city+", "+add.state;
            }
            else if(add.country) {
                my_query.fields.brandLocation=add.country;
            }
        }
        my_query.done.query=true;
        submit_if_done();
    }


    function fb_promise_then(result) {
        my_query.fields.brandFacebook=result;
        GM_addValueChangeListener("result",function() {
            console.log("FB result=",arguments[2]);
            let result=arguments[2];
            if(result.address) {
                let add=new Address(result.address);
                if(add.city && add.state) my_query.fields.brandLocation=add.city+", "+add.state;
                else if(add.country) my_query.fields.brandLocation=add.country;
            }
            if(result.email && !my_query.fields.brandEmail) my_query.fields.brandEmail=result.email;
            if(result.phone && !my_query.fields.brandPhone) my_query.fields.brandPhone=result.phone;
            if(result.name && !my_query.fields.brandName) my_query.fields.brandName=result.name;
            my_query.done.fb=true;
            submit_if_done();
        });
        GM_setValue("facebook",{"url":result,"date":Date.now()});

    }
    function twitter_promise_then(result) {
        my_query.fields.brandTwitter=result;
        my_query.done.twitter=true;
        submit_if_done();
    }
    function insta_promise_then(result) {
        my_query.fields.brandInstagram=result;
        my_query.done.insta=true;
        submit_if_done();
    }
    function youtube_promise_then(result) {
        my_query.fields.brandYouTube=result;
        my_query.done.youtube=true;
        submit_if_done();
    }
    function tiktok_promise_then(result) {
        my_query.fields.brandTiktok=result;
        my_query.done.tiktok=true;
        submit_if_done();
    }
    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
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
        var x,field;
        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=x;
        console.log("* submit_if_done, my_query.done=",my_query.done);
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones && !my_query.submitted) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
		bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var i;
        var a = document.querySelector("crowd-form a");
        my_query={name:a.innerText.trim(),fields:{brandName:"",brandSite:"",brandLogo:"",brandEmail:"",brandFacebook:"",brandInstagram:""},
                  done:{query:false,fb:false,insta:false,twitter:false,youtube:false,tiktok:false,gov:false},
		  try_count:{"query":0},
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=true; my_query.done.gov=true; submit_if_done(); });
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name + " site:facebook.com", resolve, reject, query_response,"fb");
        });
        fbPromise.then(fb_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);my_query.done.fb=true;submit_if_done(); });
        const twitterPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name + " site:twitter.com", resolve, reject, query_response,"twitter");
        });
        twitterPromise.then(twitter_promise_then)
            .catch(function(val) {
            console.log("Failed at this twitterPromise " + val);my_query.done.twitter=true;submit_if_done(); });
        const instaPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name + " site:instagram.com", resolve, reject, query_response,"insta");
        });
        instaPromise.then(insta_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);my_query.done.insta=true;submit_if_done(); });
        const youtubePromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name + " site:youtube.com", resolve, reject, query_response,"youtube");
        });
        youtubePromise.then(youtube_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);my_query.done.youtube=true;submit_if_done(); });
        const tiktokPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name + " site:tiktok.com", resolve, reject, query_response,"tiktok");
        });
        tiktokPromise.then(tiktok_promise_then)
            .catch(function(val) {
            console.log("Failed at this tiktokPromise " + val);my_query.done.tiktok=true;submit_if_done(); });


    }

})();