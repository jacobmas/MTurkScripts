// ==UserScript==
// @name         FoodGeniusMenus
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Get Menus
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["datagovus.com","grubhub.com","maps.google.com",".dinehere.us",".buzzfile.com",".yahoo.com","yelp.com","opentable.com","doordash.com"];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A3W0AYFYLP1OIS",false);
    var MTP=MTurkScript.prototype;
    function Item(text,priority) {
        this.text=text;
        this.priority=priority; }
    Item.cmp=function(item1,item2) {
        if(!item1 instanceof Item || !item2 instanceof Item) return 0;
        else if(item1.priority<item2.priority) return -1;
        else if(item2.priority<item1.priority) return 1;
        return 0; }
    function is_bad_name(b_name,p_caption,i)
    {
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
       //  console.log("lower_by="+lower_b+", lower_my="+lower_my);
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"");
        my_query.name=my_query.name.replace("’","\'");
        console.log("b_name="+b_name+", my_query.name="+my_query.name);
        if(MTP.matches_names(b_name,my_query.name)) return false;
       // console.log("# 1");
        if(i===0) return false;
        //console.log("# 2");

        return true;
    }
    function is_bad_other_menu(b_algo,b_name,b_url,p_caption,i,other_type) {

        var b_factrow=b_algo.querySelector(".b_factrow");
        if(i>1) return true;
        if(b_factrow&&is_bad_bfactrow(b_factrow)) return true;
        console.log("is_bad_other_menu, i="+i+", other_type="+other_type);
        if(other_type==="grubhub.com") return is_bad_grubhub(b_name,b_url,p_caption,i);
        else if(other_type==="doordash.com") return is_bad_doordash(b_name,b_url,p_caption,i,b_factrow);
        else if(other_type==="opentable.com") return is_bad_opentable(b_name,b_url,p_caption,i);
        return false;
    }
    function is_bad_grubhub(b_name,b_url,p_caption,i) {
        var url_regex=/grubhub\.com\/delivery\/([^\-]+)-([^\-]+)-([\d]+)/,match;
        if(!/grubhub\.com\/delivery\//.test(b_url)) return true;
        match=b_url.match(url_regex);
        console.log("is_bad_grubhub,match="+match);
        if(!match||match[3]!==my_query.zip) return true;
        console.log("Returning false, is_bad_grubhub");
        return true;
        //return false;
    }
    function is_bad_doordash(b_name,b_url,p_caption,i,b_factrow) {
        if(!b_factrow||!/doordash\.com\/.+/.test(b_url)) return true;
        else if(/doordash\.com\/(dasher\/signup|consumer\/login)/.test(b_url)) return true;
        return false;
    }

    function is_bad_opentable(b_name,b_url,p_caption,i) {
        if(!/opentable\.com\/(r)\//.test(b_url)) return true;
        return false;
    }

    function is_bad_bfactrow(b_factrow) {
        console.log("in is_good_bfactrow");
        var old_add=my_query.address.toLowerCase();
        var inner_li=b_factrow.querySelectorAll("li"),i,regex=/Location:\s*(.*)/,match,loc_str,parsedAdd;
        for(i=0;i<inner_li.length;i++) {
            if((match=inner_li[i].innerText.match(regex))) {
                loc_str=match[1].trim().replace(/\s*([\d]{5}),\s*([A-Z]+)$/,"$2 $1");
                console.log("loc_str="+loc_str);
                parsedAdd=parseAddress.parseLocation(loc_str);
                if(parsedAdd) {
                    console.log("old_add="+old_add+", parsedAdd="+JSON.stringify(parsedAdd));
                    if(parsedAdd.number && (old_add.indexOf(parsedAdd.number)===-1)) return true;
                }
            }
        }
        return false;
    }



    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a,other_type="",match;
        if(type==="other_menus" && (match=response.finalUrl.match(/site%3A([^&]*)&/))) other_type=match[1];
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(type==="menupage_url" && parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,5) && (resolve({url:parsed_context.url,type:type})||true)) return;
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                if(type==="menupage_url" && parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1) && (resolve({url:parsed_lgb.url,type:type})||true)) return;
             //   else { console.log("stuff "+(type==="url" && parsed_lgb.url)); }
                 }
            for(i=0; i < b_algo.length&&i<5; i++) {
                b_name=MTP.removeDiacritics(b_algo[i].getElementsByTagName("a")[0].textContent);
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                //
                if(type==="menupage_url" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) && !is_bad_name(b_name,p_caption,i) && (b1_success=true)) break;
                else if(type==="other_menus" && (!is_bad_name(b_name,p_caption,1) || !is_bad_other_menu(b_algo[i],b_name,b_url,p_caption,i,other_type))
                        && (b1_success=true)) break;
                else if(type==="facebook" && !is_bad_name(b_name,p_caption,1) && (b1_success=true)) break;
            }
            if(b1_success && type==="other_menus") {
                let priority=(!is_bad_name(b_name,p_caption,1) && !is_bad_other_menu(b_algo[i],b_name,b_url,p_caption,i,other_type)) ? 0 : 5;
                my_query.other_menus_list.push(new Item(b_url,priority+(i/5.))); }
            else if(b1_success && (resolve({url:b_url,type:type})||true)) return true;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(try_again(response,resolve,reject,type)) return true;
        resolve({url:"",type:type});
        return;
    }

    function try_again(response,resolve,reject,type) {
        if(type==="menupage_url") return try_again_menupage_url(response,resolve,reject,type);
        else if(type==="facebook") return try_again_facebook(response,resolve,reject,type);
        else if(type==="other_menus") return try_again_other_menus(response,resolve,reject,type);
        return false;
    }
    function try_again_menupage_url(response,resolve,reject,type) {
        var search_str;
        if(my_query.try_count[type]===0) search_str=my_query.name+" "+" "+my_query.city+" "+my_query.state;
        if(my_query.try_count[type]<1) {
            my_query.try_count[type]++;
            query_search(search_str,resolve,reject,query_response,type);
            return true;
        }
        return false;
    }
    function try_again_facebook(response,resolve,reject,type) {

        var search_str;
        if(my_query.try_count[type]===0) search_str=my_query.name+" "+my_query.city+" "+my_query.state+" site:facebook.com";
        else if(my_query.try_count[type]===1) search_str=my_query.name+" "+my_query.state+" site:facebook.com";
        if(my_query.try_count[type]<2) {
            my_query.try_count[type]++;
            query_search(search_str,resolve,reject,query_response,type);
            return true;
        }
        return false;
    }
    function try_again_other_menus(response,resolve,reject,type) {
        var search_str;
        if(my_query.try_count[type]===0) search_str=my_query.name+" "+my_query.city+" "+my_query.state+" site:grubhub.com";
        else if(my_query.try_count[type]===1) search_str=my_query.name+" "+my_query.city+" "+my_query.state+" site:doordash.com";
                else if(my_query.try_count[type]===2) search_str=my_query.name+" "+my_query.city+" "+my_query.state+" site:opentable.com";

        if(my_query.try_count[type]<3) {
            my_query.try_count[type]++;
            query_search(search_str,resolve,reject,query_response,type);
            return true;
        }
        return false;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str+", try_count["+type+"]="+my_query.try_count[type]);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }
    function parse_fb_about_then(result) {
        var type="menupage_url";
        my_query.done["facebook"]=true;
        console.log("parse_fb_about,result="+JSON.stringify(result));
        if((my_query.use_acct || (my_query.done[type] && (!my_query[type] || my_query[type].length===0))) && result.url) {
            my_query.done[type]=false;
            my_query[type]=result.url;
            console.log("Calling "+ my_query[type]);
            var promise=MTP.create_promise(my_query[type],find_menu_page,find_menu_then,function(response) {
                console.log("Failed menupages");
                my_query.fields[type]="";
                my_query.done[type]=true;

                 submit_if_done();
            });
        }
        submit_if_done();
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("# result="+JSON.stringify(result));
        if(result.type!=="menupage_url"||result.url==="") {
             if(result.type==="facebook") {
                 console.log("THIS IS FACEBOOK");
                my_query.fb_about_url=result.url.replace(/(facebook\.com\/[^\/]+).*$/,"$1")
                    .replace(/facebook\.com\//,"facebook.com/pg/").replace(/\/$/,"")+"/about/?ref=page_internal";
                let fb_promise=MTP.create_promise(my_query.fb_about_url,MTP.parse_FB_about,parse_fb_about_then);
                 my_query.begin_fb=true;
                 my_query.fields[result.type]=result.url;
            }
            else {
                my_query.done[result.type]=true;
                my_query.other_menus_list.sort(Item.cmp);
                console.log("my_query.other_menus_list="+JSON.stringify(my_query.other_menus_list));
                my_query.fields[result.type]=my_query.other_menus_list.length>0?my_query.other_menus_list[0].text:"";
            }
            

            submit_if_done();
        }
        else {

            my_query[result.type]=result.url;
            var promise=MTP.create_promise(my_query[result.type],find_menu_page,find_menu_then,function(response) {
                console.log("Failed menupages");
                my_query.fields[result.type]="";
                my_query.done[result.type]=true;
                submit_if_done();
            });
        }

    }
    function find_menu_page(doc,url,resolve,reject) {
        var weird_menu_list=[];
        var links=doc.links,i,bad_regex=/^\s*(javascript|menu|tel|mailto)/;
                console.log("find_menu_page,url="+url+",links.length="+links.length);

        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
            if(/facebook\.com/.test(links[i].href)&&!MTP.is_bad_fb(links[i].href)) my_query.fields["facebook"]=links[i].href;
           // console.log("# ("+i+"),text="+links[i].innerText+", url="+links[i].href);
            if(/Menu|Dinner|Dining|Cocktails|Wine|Sake|Dessert|Food|Appetizers|Pasta/i.test(links[i].innerText.trim()) &&
               !MTP.is_bad_url(links[i].href,bad_urls,-1) && !bad_regex.test(links[i].href) &&
              !weird_menu_list.includes(links[i].href)
              && !weird_menu_list.includes(links[i].href.replace(/https/,"http"))
                                                                                      &&!weird_menu_list.includes(links[i].href.replace(/http:/,"https:"))
              ) weird_menu_list.push(links[i].href);
            else if(!bad_regex.test(links[i].href)&& /\/menu/i.test(links[i].href) && !MTP.is_bad_url(links[i].href,bad_urls,-1) &&
                   !weird_menu_list.includes(links[i].href)&&!weird_menu_list.includes(links[i].href.replace(/https/,"http"))
                                                                                      &&!weird_menu_list.includes(links[i].href.replace(/http:/,"https:"))
                                                                                      ) weird_menu_list.push(links[i].href);
        }
        if(weird_menu_list.length>0) resolve({list:weird_menu_list});
        else resolve({list:[url]});
    }
    function find_menu_then(result) {
        console.log("find_menu_then,result="+result);
        var i;
        var lst=result.list;
        console.log("lst="+JSON.stringify(result));
        my_query.fields.menupage_url="";
        var promise_list=[],promise;
        for(i=0;i<lst.length;i++) {
            my_query.fields.menupage_url+=(my_query.fields.menupage_url.length>0?",":"")+lst[i];

            promise_list.push(MTP.create_promise(lst[0],find_menu_pdfs,MTP.my_try_func));
        }
        Promise.all(promise_list).then(find_menu_pdfs_then);
       
    }
    function find_menu_pdfs(doc,url,resolve,reject) {
        var links=doc.links,i,bad_regex=/^\s*(javascript|menu|tel)/;

        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url);
            //console.log("# ("+i+"),text="+links[i].innerText+", url="+links[i].href);
            if(/\.pdf($|[^a-zA-z0-9])/i.test(links[i].href)&& !my_query.pdf_list.includes(links[i].href)
              ) {
                my_query.fields.menupage_url+=(","+links[i].href);
                my_query.pdf_list.push(links[i].href); }
        }
        resolve("");
    }
    function find_menu_pdfs_then(result) {
        my_query.done.menupage_url=true;
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
        var checkbox_map={"menupage_url":"no_page","facebook":"no_facebook","other_menus":"no_delivery"};
        var checkboxes={};
        for(x in checkbox_map) checkboxes[checkbox_map[x]]=document.getElementsByName(checkbox_map[x])[0];
        for(x in my_query.fields) {

            if(my_query.fields[x].length>0 && (field=document.getElementsByName(x)[0])) {
                field.value=my_query.fields[x];
                checkboxes[checkbox_map[x]].checked=false;
            }
            else {
                checkboxes[checkbox_map[x]].checked=true;
            }
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        console.log("submit_if_done, my_query="+JSON.stringify(my_query));
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        bad_urls=bad_urls.concat(default_bad_urls);
        console.log("bad_urls="+JSON.stringify(bad_urls));
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
      
        my_query={name:wT.rows[0].cells[1].innerText,address:wT.rows[1].cells[1].innerText,city:wT.rows[3].cells[1].innerText,
                  state:wT.rows[4].cells[1].innerText,zip:wT.rows[5].cells[1].innerText,pdf_list:[],
                  fields:{menupage_url:"",facebook:"",other_menus:""},done:{},submitted:false,try_count:{},other_menus_list:[]};
        my_query.use_acct=/use acct\s*[\d]*/.test(my_query.name);
        my_query.name=my_query.name.replace(/^[^A-Za-z0-9\s]+/,"").replace(/use acct\s*[\d]*/,"Restaurant");
        for(var x in my_query.fields) {
            my_query.done[x]=false;
            my_query.try_count[x]=0; }
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.address+" "+my_query.city+" "+my_query.state+"";
        const queryPromise = new Promise((resolve, reject) => {
            query_search(search_str, resolve, reject, query_response,"menupage_url");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        search_str=my_query.name+" "+my_query.address+" "+my_query.city+" "+my_query.state+" site:facebook.com";
        const queryPromise2 = new Promise((resolve, reject) => {
            query_search(search_str, resolve, reject, query_response,"facebook");
        });
        queryPromise2.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        search_str=my_query.name+" "+my_query.address+" "+my_query.city+" "+my_query.state+" site:grubhub.com";
        const queryPromise3 = new Promise((resolve, reject) => {
            query_search(search_str, resolve, reject, query_response,"other_menus");
        });
        queryPromise3.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();