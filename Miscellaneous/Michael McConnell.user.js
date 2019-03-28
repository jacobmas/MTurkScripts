// ==UserScript==
// @name         Michael McConnell
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Amazon book scraper
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
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"AG86C9OKOIL8H",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        b_name=b_name.replace(/\s*(\.)*$/,"").replace(/\s*[\(\)]+.*$/,"").replace(/ by .*$/,"").replace(/(\s)\s+/g," ")
        .replace(/:/g,"");
        my_query.name=my_query.name.replace(/(\s)\s+/g," ");

        console.log("is_bad_name,b_name="+b_name.toLowerCase()+", my_query.name="+my_query.name.toLowerCase());
        if(MTP.matches_names(b_name,my_query.name)) return false;
        else if(my_query.name.toLowerCase().indexOf(b_name.toLowerCase())!==-1 ||
              b_name.toLowerCase().indexOf(my_query.name.toLowerCase())!==-1 ) return false;
        else if(my_query.name.toLowerCase().replace(/\s/g,"")===b_name.toLowerCase().replace(/\s/g,"")) return false;
        return true;
    }

    function is_good_publisher(b_url) {
        var domain=MTP.get_domain_only(b_url);
        console.log("is_good_publisher,domain="+domain+", publisher="+my_query.publisher);
        if(/hayhouse/.test(domain) && /Hay\s*house/i.test(my_query.publisher)) return true;
        if(/harpercollins|penguinrandomhouse|simonandschuster/.test(domain)) return true;
        var short_publisher=MTP.shorten_company_name(my_query.publisher).replace(/\s*Company$/i,"").replace(/\s*Press$/i,"")
        .replace(/&.*$/,"")
        .replace(/\s/g,"").toLowerCase();
        console.log("short_publisher="+short_publisher);
        if(domain.indexOf(short_publisher)!==-1) return true;
        return false;
    }
    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
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
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(type==="itunes" && /\/us\//.test(b_url) && !is_bad_name(b_name) && (b1_success=true)) break;
                if(type==="publisher" && is_good_publisher(b_url) && (b1_success=true)) break;
            }
            if(type==="itunes" && b1_success) {
                my_query.fields.iTunesURL=b_url;
               resolve(type);
                return;
            }
            if(type==="publisher" && b1_success) {
                my_query.fields.bookwebsite=b_url;
               resolve(type);
                return;
            }
        }
        catch(error) {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;
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

    /* Following the finding the district stuff */
    function query_promise_then(result) {

        my_query.done[result.type]=true;
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
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    function parse_amazon_item(item) {
        var ret={success:false};
        var right=item.querySelector(".a-col-right"),i;
        var arow_none=right.querySelectorAll(".a-row.a-spacing-none"),authors;
        var title=item.querySelector(".s-access-title"),date=item.querySelector(".a-size-small.a-color-secondary");
        var img=item.querySelector(".s-access-image");
        var offscreen=right.querySelector(".a-offscreen");
        var stars=right.querySelector(".a-icon-star .a-icon-alt"),numreviews=right.querySelector(".a-span5 .a-size-small");
        var audiobook=right.querySelector("a[title='Audible Audiobook']");
        if(!title || is_bad_name(title.innerText.trim())) return false;
        my_query.fields.title=title.innerText.trim();
        my_query.short_name=my_query.fields.title.replace(/:.*$/,"");
        my_query.fields.bookURL=title.parentNode.href.replace(/\/ref\=.*$/,"");
        if(date) my_query.fields.date=date.innerText.trim();
        if(img) my_query.fields.imageURL=img.src;

        if(stars) my_query.fields.stars2=stars.innerText.replace(/\s.*$/,"").trim();
        if(numreviews) my_query.fields.numreviews=numreviews.innerText.trim();
        if(offscreen) my_query.fields.price=offscreen.innerText.trim();
        if(audiobook) my_query.fields.audioURL=audiobook.href.replace(/\/ref\=.*$/,"");
        add_to_sheet();

        return true;
    }

    function parse_amazon_init(doc,url,resolve,reject) {
        console.log("in parse_amazon_init,url="+url);
        var result_lst=doc.querySelectorAll("#s-results-list-atf .s-result-item");
        var parsed={},i;
        for(i=0;i<result_lst.length;i++) {
            if(parse_amazon_item(result_lst[i])) {
                var promise=MTP.create_promise(my_query.fields.bookURL,parse_amazon_book,resolve,reject);
                return;
            }
        }
        reject("Couldn't find on amazon");
    }
    function parse_amazon_book(doc,url,resolve,reject) {
        console.log("in parse_amazon_book,url="+url);
        //console.log("doc.body.innerHTML="+doc.body.innerHTML);
        var i,match,regex=/^\s*Publisher:\s*([^;]*)/;
        var desc=doc.querySelector("#bookDescription_feature_div noscript")
        var lst=doc.querySelectorAll("#productDetailsTable .content li");
        var stars=doc.querySelector("#averageCustomerReviews .a-icon-star");
        var author=doc.querySelectorAll(".author .a-declarative .a-link-normal");
        if(author.length===0) author=doc.querySelectorAll(".author > .a-link-normal");
        my_query.fields.author="";
        for(i=0;i<author.length;i++) {
            my_query.fields.author=my_query.fields.author+(my_query.fields.author.length>0?",":"")+author[i].innerText.trim(); }
        if(stars) my_query.fields.stars2=stars.innerText.replace(/\s.*$/,"").trim();
        add_to_sheet();
        console.log("my_query.fields.stars2=("+my_query.fields.stars2+")");

        if(desc) my_query.fields.desc=desc.innerText;
        add_to_sheet();
        for(i=0;i<lst.length;i++) {
            if((match=lst[i].innerText.match(regex))) {
                my_query.publisher=match[1].replace(/[\(\)]+.*$/,"");
                console.log("my_query.publisher="+my_query.publisher);
            }
        }

        resolve("amazon");
    }
    function parse_thing_then(result) {
        console.log("* Done "+result);
        my_query.done[result]=true;
        if(result==="amazon") {
            begin_next_queries(); }
        submit_if_done();
    }
    function parse_play_cluster(url,elem) {
        var type="",c_title=elem.querySelector(".title-link"),cards=elem.querySelectorAll(".card"),i;
        var title,title_text;
        if(!c_title) return;
        if(/Audiobooks/.test(c_title.innerText)) type="playaudiobookURL";
        else if(/Ebooks/.test(c_title.innerText)) type="playebookURL";
        else return;
        for(i=0;i<cards.length;i++) {
            title=cards[i].querySelector(".title");
            title_text=title.innerText.replace(/--.*$/,"");
            console.log(type+": title["+i+"]="+title_text.trim());
            if(!is_bad_name(title_text.trim(),my_query.name)) {
                my_query.fields[type]=MTP.fix_remote_url(title.href,url);
                break; }

        }
    }
    function parse_play(doc,url,resolve,reject) {
        var clusters=doc.querySelectorAll(".id-cluster-container");
        clusters.forEach(function(elem) { parse_play_cluster(url,elem); });
        resolve("play");
    }

    function parse_audible(doc,url,resolve,reject) {
        console.log("parse_audible,url="+url);
        var rx=/[:]+.*$/;
        var links=doc.querySelectorAll(".productListItem h3 a"),i;
        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url);
           // console.log("links["+i+"].innerText="+links[i].innerText);
            if(MTP.matches_names(links[i].innerText.replace(rx,"").trim(),my_query.name)) {
                my_query.fields.audibleURL=links[i].href.replace(/\?qid\=.*$/,"");
                break;
            }
        }
        resolve("audible");
    }
    function begin_next_queries() {
        var search_str=my_query.name+" "+my_query.fields.author.replace(/,.*$/,"")+" site:itunes.apple.com";
        if(my_query.done.audible && my_query.fields.audibleURL==="") {
            my_query.done.audible=false;
            my_query.audible_url="https://www.audible.com/search?keywords="+encodeURIComponent(my_query.short_name);
            var promise=MTP.create_promise(my_query.audible_url,parse_audible,parse_thing_then);
        }
        const iTunesPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search for itunes");
            query_search(search_str, resolve, reject, query_response,"itunes");
        });
        iTunesPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.itunes="true"; submit_if_done(); });
        const publisherPromise = new Promise((resolve, reject) => {
            search_str=my_query.publisher+" "+my_query.name+" "+my_query.fields.author.replace(/,.*$/,"")+" -site:amazon.com -site:ebay.com";
            console.log("Beginning URL search for publisher");
            query_search(search_str, resolve, reject, query_response,"publisher");
        });
        publisherPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this publisherPromise " + val); my_query.done.publisher="true"; submit_if_done(); });
    }
    function init_Query()
    {
        console.log("in init_query");
        var i,crowdinput=document.querySelectorAll("form crowd-input"),inp;
        var field_list=["title","date","author","stars2","numreviews","desc","price","audioURL","bookURL","imageURL",
                        "playebookURL","playaudiobookURL","iTunesURL","audibleURL","bookwebsite"];
        for(i=0;i<crowdinput.length;i++) {
            crowdinput[i].required=false;
            crowdinput[i].type="text";
            crowdinput[i].setAttribute("type","text");
            crowdinput[i].id=field_list[i];
        }

        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        var name=document.querySelector("form div div div strong").innerText.replace(/^[^:]+:\s*/,"");
        var url=document.querySelector("form div div div a").href;

        my_query={name:name,url:url,
                  fields:{},done:{"amazon":false,"play":false,"audible":false,"itunes":false,"publisher":false},
                  submitted:false};
        my_query.name=my_query.name.replace(/ by [A-Z][a-z]+.*$/,"");
	console.log("my_query="+JSON.stringify(my_query));
        for(i=0;i<field_list.length;i++) my_query.fields[field_list[i]]="";
        var promise_list=[];
        my_query.play_url="https://play.google.com/store/search?q="+encodeURIComponent(my_query.name);
        my_query.audible_url="https://www.audible.com/search?keywords="+encodeURIComponent(my_query.name);
        promise_list.push(MTP.create_promise(my_query.url,parse_amazon_init,parse_thing_then));
        promise_list.push(MTP.create_promise(my_query.play_url,parse_play,parse_thing_then));
         promise_list.push(MTP.create_promise(my_query.audible_url,parse_audible,parse_thing_then));


    }

})();