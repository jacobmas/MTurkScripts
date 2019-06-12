// ==UserScript==
// @name         ZachElliott
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
// @grant GM_deleteValue
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/School/Schools.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js

// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A25FMDSQH98IOJ",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject) {
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
                console.log("parsed_context="+JSON.stringify(parsed_context));
                resolve(parsed_context);
                return;


            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }

        }
        catch(error) {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }
    function replace_th(match,p1,p2) {
        var str_map={"4":"Four","5":"Five","6":"Six","7":"Seven","8":"Eight","9":"Nine","10":"Ten","11":"Eleven","12":"Twelve","13":"Thirteen"};
        if(str_map[p1]) return str_map[p1]+"th"+p2;
        else return match;
    }
    function matches_parsed_streets(street1,street2) {
        var num_replace_lst=[{rx:/^1st($|[^A-Za-z0-9]+)/,replacer:"First$1"},{rx:/^2nd($|[^A-Za-z0-9]+)/,replacer:"Second$1"},
                             {rx:/^3rd($|[^A-Za-z0-9]+)/,replacer:"Third$1"},{rx:/^([\d]+)th($|[^A-Za-z0-9]+)/,replacer:replace_th}];
        var i,x;
        for(i=0;i<num_replace_lst.length;i++) {
            x=num_replace_lst[i];
            street1=street1.replace(x.rx,x.replacer);
            street2=street2.replace(x.rx,x.replacer);
        }
        return street1.replace(/[-\s]+/g,"").toLowerCase()!==street2.replace(/[-\s]+/g,"").toLowerCase();

    }
   function matches_parsed_adds(add1,add2) {
        var x,equiv_units,count_bad=0,curr_bad=false;
       console.log("matches_parsed_adds,add1="+JSON.stringify(add1)+", add2="+JSON.stringify(add2));
        for(x in add2) {
            curr_bad=false;
            if(x==="sec_unit_type") continue;

            if(!add1[x]) continue;
            if(x==="street") curr_bad = matches_parsed_streets(add1[x],add2[x]);
            else curr_bad=add1[x].replace(/[-\s]+/g,"").toLowerCase()!==add2[x].replace(/[-\s]+/g,"").toLowerCase();
            if(curr_bad) {
                count_bad++;
                console.log("Failed to match addressses on "+x);
                if((x==="street" && add1[x].indexOf(add2[x])===-1 &&
                    add2[x].indexOf(add1[x])===-1) || count_bad>=2) return false;
            }
        }
        return true;
    }

    /* Following the finding the district stuff */
    function query_promise_then(parsed_context) {
        if(parsed_context.Address) {
            my_query.foundAddress=parseAddress.parseLocation(parsed_context.Address);
            if(my_query.foundAddress && matches_parsed_adds(my_query.origAddress,my_query.foundAddress)) {
                document.getElementById("radios-0").checked=true;
            }
            else {
                document.getElementById("radios-1").checked=true;
            }
        }
        if(parsed_context.url) {
            my_query.fields.textinput=parsed_context.url; }
        else document.getElementById("radios-2").checked=true;
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
    function parse_web_addphone(doc,url,resolve,reject,level) {
        if(level==undefined || typeof(level)==="object") level=0;
        console.log("in parse_web_addphone, url="+url+", level="+level);
        var result={},url_list=[];
        var p=doc.querySelectorAll("p,div,li"),i,match,text;
        var phoneMatch=doc.body.innerHTML.match(/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}(\s*x\s*[\d]{1,3})?/ig);
        var parsedAdd,links=doc.links,promise_list=[],len;
        if(phoneMatch) {
            for(i=0;i<phoneMatch.length;i++) {
                if(!my_query.parsedPhones.includes(phoneMatch[i].replace(/[^\d]+/g,""))) my_query.parsedPhones.push(phoneMatch[i].replace(/[^\d]+/g,""));
            }
        }
        try {

            if(level===0) {
                promise_list.push(MTP.create_promise(url,parse_web_addphone,MTP.my_then_func,MTP.my_catch_func,1));
                for(i=0;i<links.length;i++) {
                    links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\//,"");
                    // console.log("links["+i+"]="+links[i].href);

                    if(/facebook\.com/.test(links[i].href) && !my_query.fb_url) my_query.fb_url=links[i].href;
                    if(/Contact/i.test(links[i].innerText) &&
                       MTP.get_domain_only(links[i].href.toLowerCase(),true)===MTP.get_domain_only(url,true) && !url_list.includes(links[i].href)) {
                        url_list.push(links[i].href);
                        promise_list.push(MTP.create_promise(links[i].href,parse_web_addphone,MTP.my_then_func,MTP.my_catch_func,1));
                    }
                }
                Promise.all(promise_list).then(function() { resolve(""); }).catch(function() { reject(""); });
                return;
            }
        }
        catch(error) { console.log("Error part ="+error); }
        try {
            //console.log("p.length="+p.length);
            for(i=0;i<p.length;i++) {
                //if(p[i].querySelector("p,div")) continue;
                // console.log("i="+i+", p[i].innerText="+p[i].innerText);
                if((match=p[i].innerText.match(/(^|\n|,).*\n+.*,?\s*[A-Za-z]{2}\s+\d{5}/))) {
                    console.log("What");
                    text=match[0].replace(/\n+/g,",").replace(/^(\n|,)/,"");
                    console.log("text="+text);

                }
                else text=p[i].innerText;
                // console.log("MUNG");
                if(text.length>350) continue;
                parsedAdd=parseAddress.parseLocation(text);
                //  console.log("DUNG");
                if((match=p[i].innerText.match(phone_re))&&(len=match[0].replace(/[^\d]+/g,"").length)&&len==10)
                    //            console.log("PUNG");

                    if(parsedAdd&&(parsedAdd.sec_unit_type||parsedAdd.street)&&parsedAdd.city&&parsedAdd.state&&parsedAdd.zip) {

                        console.log("parsedAdd="+JSON.stringify(parsedAdd));
                        my_query.parsedAdds.push(parsedAdd);
                        my_query.fields.addressLine1=(parsedAdd.number?parsedAdd.number+" ":"")+
                            (parsedAdd.street?parsedAdd.street+" ":"")+(parsedAdd.type?parsedAdd.type+" ":"")+
                            (parsedAdd.suffix?parsedAdd.suffix+" ":"")+(parsedAdd.sec_unit_type?parsedAdd.sec_unit_type+" ":"")
                            +(parsedAdd.sec_unit_num?parsedAdd.sec_unit_num+" ":"");
                        my_query.fields.addressLine1=my_query.fields.addressLine1.trim();
                        if(parsedAdd.city) my_query.fields.city=parsedAdd.city;
                        if(parsedAdd.state) my_query.fields.stateOrRegion=parsedAdd.state;
                        if(parsedAdd.zip) my_query.fields.zip=parsedAdd.zip;



                    }



            }
        }
        catch(error) { console.log("Error="+error); }
        console.log("Going to resolve");
        resolve("");

    }
    function parse_web_catch(response) {
        var q=document.getElementsByName("Funeral Home URL");
        console.log("Failed web?");
        q[3].checked=true;
        MTurk.check_and_submit();
    }
    function parse_web_then(result) {

        console.log("parse_web_then: my_query="+JSON.stringify(my_query));
        var i;
        //var q=document.getElementsByName("Question"),i;
        //console.log("q="+q+", length="+q.length);
      //   q[1].checked=true;
        var phoneEl=document.getElementsByName("Funeral Home Phone #");
        phoneEl[1].checked=true;
        document.getElementsByName("Funeral Home URL")[1].checked=true;
        for(i=0;i<my_query.parsedAdds.length;i++) {
           // console.log("i="+i);
         /*   if(matches_parsed_adds(my_query.origAddress,my_query.parsedAdds[i])) {
              //  q[0].checked=true;
            }*/

        }
        for(i=0;i<my_query.parsedPhones.length;i++) {
           // console.log("i="+i);
            if(my_query.origPhone===my_query.parsedPhones[i].replace(/[^\d]+/g,"")) {
              phoneEl[0].checked=true;
            }

        }
        document.getElementsByName("Funeral Home URL")[1].checked=true;

        MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var address=document.querySelectorAll("form i");
        var query=document.querySelectorAll("form strong");
        var url=document.querySelectorAll("a");
        my_query={url:url[url.length-1].href,query_str:query[1].innerText,address:address[1].innerText,phone:address[2].innerText,

                  fields:{url:0},
                  parsedAdds:[],parsedPhones:[],
                  done:{},submitted:false};
        my_query.origPhone=my_query.phone.replace(/[^\d]+/g,"");
        my_query.origAddress=parseAddress.parseLocation(my_query.address);
	console.log("my_query="+JSON.stringify(my_query));
       var webPromise=MTP.create_promise(my_query.url,parse_web_addphone,parse_web_then,parse_web_catch);
    }

})();