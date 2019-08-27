// ==UserScript==
// @name         GenericAddress
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find Address (Akshay Sutrave)
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://*cloudfront.net/*
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/aaeb535ced5665689d06033dc62b8f685ae6186e/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/aaeb535ced5665689d06033dc62b8f685ae6186e/global/AggParser.js

// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A2A83KVDMOQZ4W",true);

    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,type,i)
    {
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=MTP.shorten_company_name(my_query.name).replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        let temp_b_name=MTP.removeDiacritics(b_name).replace(b_replace_reg,"");
        let temp_name=MTP.shorten_company_name(MTP.removeDiacritics(my_query.name)).replace("’","\'");
        console.log("b_name="+temp_b_name+", my_query.name="+temp_name);

        if(MTP.matches_names(temp_b_name,temp_name)) return false;

        if(temp_b_name.toLowerCase().indexOf(temp_name.toLowerCase())!==-1) return false;
        return true;
    }
  
   function add_text(text) {
        var fl_regex=/(,\s*)?([\d]+(th|rd|nd) Fl(?:(?:oo)?r)?)\s*,/i,match;
        var floor=text.match(fl_regex);
        text=text.replace(fl_regex,",").replace(/,\s*USA$/,"").trim();
        var parsed=parseAddress.parseLocation(text),add1,add2,city,state,zip;
        if(parsed&&parsed.city&&parsed.state) {
            console.log("parsed="+JSON.stringify(parsed));
            add1=(parsed.number?parsed.number+" ":"")+(parsed.prefix?parsed.prefix+" ":"")+
                (parsed.street?parsed.street+" ":"")+(parsed.type?parsed.type+" ":"")+(parsed.suffix?parsed.suffix+" ":"");
            add2=(parsed.sec_unit_type?parsed.sec_unit_type+" ":"")+
                (parsed.sec_unit_num?parsed.sec_unit_num+" ":"");
            city=parsed.city?parsed.city:"";
            state=parsed.state?parsed.state:"";
            zip=parsed.zip?parsed.zip:"";
            document.getElementsByName("address1")[0].value=add1;
            document.getElementsByName("address2")[0].value=add2;
            document.getElementsByName("city")[0].value=city;
            document.getElementsByName("state")[0].value=state;
            document.getElementsByName("zip")[0].value=zip;
        }
        else if(match=text.match(/([A-Z]{1}\d{1}[A-Z]{1} \d{1}[A-Z]{1}\d{1})$/)) {
            document.getElementsByName("zip")[0].value=match[0];
            text=text.replace(/,?\s*([A-Z]{1}\d{1}[A-Z]{1} \d{1}[A-Z]{1}\d{1})$/,"");
            console.log("text="+text);
            if(match=text.match(/,\s*([A-Z]+)\s*$/)) {
                document.getElementsByName("state")[0].value=match[1];
            }
            text=text.replace(/,\s*([A-Z]+)\s*$/,"");
            console.log("text="+text);
            if(match=text.match(/^(.*),\s*([^,]*)$/)) {
                document.getElementsByName("address1")[0].value=match[1];
                document.getElementsByName("city")[0].value=match[2];
            }
        }
        else {
            document.getElementsByName("address1")[0].value=text;

        }
   }

    function urlcatch(val,type) {
        console.log("Failed at "+type+" promise " + val);
        my_query.done[type]=true;
        my_query.failed_urls++;


        submit_if_done();
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var good_url="";
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption,b_address;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            b_address=doc.querySelector(".b_address");
            let b_ans=doc.querySelector(".b_ans");
            //if(b_ans) console.log("b_ans="+b_ans.innerText);
            if(b_address) {
              //  console.log("b_address.innerText="+b_address.innerText);
                Address.addressList.push(new Address(b_address.innerText,1,response.finalUrl));
            }

            if(type==="address" && b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                if(parsed_context.Address) {
                    Address.addressList.push(new Address(parsed_context.Address,2,response.finalUrl));

                }
                console.log("parsed_context="+JSON.stringify(parsed_context));

            }
            if(type==="query" && b_context&&(parsed_context=MTP.parse_b_context(b_context)) && parsed_context.url &&
               !MTP.is_bad_url(parsed_context.url,bad_urls,-1,3) && (resolve(parsed_context.url)||true)) return;
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                if(parsed_lgb.address) {
                    Address.addressList.push(new Address(parsed_lgb.address,3,response.finalUrl));

                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            }
            for(i=0; i < b_algo.length&&i<5; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href.replace(/\/en($|\/[^\/]*)/,"").replace(/\/$/,"");
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                 b_factrow=b_algo[i].querySelector(".b_factrow");
                if(/query|address/.test(type) && !is_bad_name(b_name,type,i) && b_factrow) {
                    console.log("b_factrow="+b_factrow.innerHTML);
                    do_bfactrow(b_factrow,my_query.try_count[type],b_url,i); }
              test_row(b_name,b_url,p_caption,i);
              if(type==="query" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) && !/\.gov(\/|$)/.test(b_url) && !is_bad_name(b_name,type,i) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
     if(my_query.try_count[type]===0&&type==="address"&&Address.addressList.length===0) {
            my_query.try_count[type]++;
            if(type==="address") query_search(my_query.name, resolve, reject, query_response,"address");
            //if(type==="query") query_search(my_query.name, resolve, reject, query_response,"query");

            return;
        }
        reject("Nothing found");
        return;
    }
    function test_row(b_name,b_url,p_caption,i) {
        var corpoffice_re=/is based in (.*)\. This is located in(?: the)? (.*), with the state being (.*)\. The pin code of the area is ([\d]*)/,match;
        var bizapedia_re=/is located at (.* [\d\-]{5,})\./;
        if(b_url.indexOf("corporateofficeheadquarters.org")!==-1) {
            if(match=p_caption.match(corpoffice_re)) {
                Address.addressList.push(new Address(match[1]+", "+match[2]+", " +match[3]+" " +match[4],3+i,b_url));
            }
        }
        if(b_url.indexOf("bizapedia")!==-1 && (match=p_caption.match(bizapedia_re))) {
            Address.addressList.push(new Address(match[0],3+i,b_url));

        }
        var url_match=b_url.match(/(buzzfile|bizapedia)\.com/);
        if(!is_bad_name(b_name,"query",i) && url_match) {
            console.log("Success, url_match="+url_match);
            my_query.done[url_match[1]]=false;
            let promise=MTP.create_promise(b_url,AggParser["parse_"+url_match[1]],parse_aggsite_then,function() {
                my_query.done[url_match[1]]=true; submit_if_done(); }, 3+i);
        }



    }
    function parse_aggsite_then(result) {
        console.log("parse_aggsite, result="+JSON.stringify(result));
        my_query.done[result.site]=true;
        if(result.address) Address.addressList.push(result.address);
        submit_if_done();
    }

    function do_bfactrow(b_factrow,try_count,b_url,pos) {
        var i;
        var inner_li=b_factrow.querySelectorAll("li");
        inner_li.forEach(function(inner_li) {
            var regex=/Location:\s*(.*)$/,match,text;
            if((match=inner_li.innerText.match(regex)) && !my_query.fields.city) {
                console.log("# Trying b_factrow with "+inner_li.innerText);

                text=match[1].trim().replace(/\s*([\d\-]{5,}),\s*([A-Za-z\s]+)\s*$/,"$2 $1");
                text=text.replace(/[,\s]*United States$/,"");
                console.log("* Adding address in b_factrow "+text);
                Address.addressList.push(new Address(text,3+try_count+pos,b_url));
                add_to_sheet();
                //add_text(text);
            }

        });
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

        add_to_sheet();
       
        my_query.done.query=true;
        my_query.url=result;
        console.log("FOUND URL="+my_query.url);
        var url=MTP.create_promise(my_query.url,Address.scrape_address,parse_site_then,function(response) {
            console.log("Failed "+response);
            my_query.done.url=true; submit_if_done(); },
                                           {depth:2});
        submit_if_done();

    }
    function add_promise_then(result) {

        my_query.done.address=true;

        submit_if_done();

    }
    function parse_site_then(result) {
        console.log("in parse_site_then, result="+JSON.stringify(result));
        my_query.done.url=true;

        submit_if_done();

    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined && Address!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }
    function update_address() {
        var top,x;
        var field_map={"postcode":"Zipcode/Postal Code","city":"City","state":"State","url":"Source URL"};
        console.log("Address.addressList="+JSON.stringify(Address.addressList));
        Address.addressList=Address.addressList.filter(x => x.priority < (1 << 25));
        console.log("Address.addressList="+JSON.stringify(Address.addressList));

        Address.addressList.sort(function(add1,add2) {
    if(!(add1 instanceof Address && add2 instanceof Address)) return 0;
    if(add1.priority<add2.priority) return -1;
    else if(add1.priority>add2.priority) return 1;
    else return 0;
});
        if(Address.addressList.length===0) return;
        top=Address.addressList[0];
        for(x in field_map) {
            my_query.fields[field_map[x]]=top[x];
        }
       // my_query.fields["Source URL"]=my_q

    }
    function add_to_sheet() {
        var x,field;
        update_address();
    console.log("my_query.fields="+JSON.stringify(my_query.fields));
	for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
	       (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        console.log("submit_if_done, my_query.done="+JSON.stringify(my_query.done));
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) {
            if(my_query.fields.City.length>0) MTurk.check_and_submit();
            else GM_setValue("returnHit"+MTurk.assignment_id);
        }
    }
    function do_address_paste(e) {
        e.preventDefault();

        var text = e.clipboardData.getData("text/plain").replace(/\s*\n\s*/g,",").replace(/,,/g,",").replace(/,\s*$/g,"").trim();
        console.log("text="+text);
        var temp_add=new Address(text,-50,document.querySelector("[name='Source URL']").value);
        if(temp_add.priority<1000) {
            Address.addressList.push(temp_add);
            add_to_sheet();
        }
        else {
            document.querySelector("[name='City']").value=text;
        }

      // add_text(text);
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var inp=document.querySelectorAll("input");
        var x;
        var a=document.querySelectorAll("form a");


       
        my_query={name:a[0].innerText,country:a[1].innerText,fields:{"City":"","State":"","Zipcode":"","Source URL":""},
                  done:{address:false,query:false,url:false},submitted:false,try_count:{"address":0,"query":0},
                  response:{address_found:"Yes",address:{address1:"",address2:"",city:"",state:"",postcode:"",country:""}},
                  address_list:[],
                  address_str_list:[]



                 };
        document.querySelector("crowd-input[name='City']").addEventListener("paste",do_address_paste);
        console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.country;
        const addPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"address");
        });
        addPromise.then(add_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.address=true;
            submit_if_done();
        });
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.query=true;
            my_query.done.url=true;
            submit_if_done();
        });
         /*var url=MTP.create_promise(my_query.url,scrape_address,parse_site_then,function(val) { urlcatch(val,"url") },
                                           {type:"url",ext:""});*/
    }

})();