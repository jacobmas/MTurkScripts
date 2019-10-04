// ==UserScript==
// @name         Alex Simoes
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find restaurant
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.yelp.com/*
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
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,250+(Math.random()*100),[],begin_script,"A1XN77PKGB8LWI",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function parse_b_context2(b_context) {
        var ret={};
        var b_entityTP=b_context.querySelector(".b_entityTP");
        var b_entityTitle,infoCard,about,x,match,b_subModule,b_entitySubTitle;
        var splspli,exp,prof;
        if(!b_entityTP) return ret;
        console.log("b_entityTP="+JSON.stringify(b_entityTP.dataset));
        if(b_entityTP.dataset.feedbkIds==="Restaurant") {
            var restaurant=parse_bing_restaurant(b_entityTP);
            ret.restaurant=restaurant;
        }
        return ret;
    }
    function parse_bing_restaurant(b_entityTP) {
        var ret={in_business:false},x,open_hrs=b_entityTP.querySelector("#mh_cdb_datagroupid_openhours");
        var footnote_sites=b_entityTP.querySelectorAll(".b_suppModule .b_footnote a");
        if(open_hrs) ret.in_business=true;
        if(b_entityTP.querySelector("#permanentlyClosedIcon")) ret.in_business=false;
        for(x of footnote_sites) ret[x.innerText.trim()]=x.href;
        return ret;
    }

    function parse_yelp_inner(parsed) {
        console.log("in parse_yelp_inner");
        function decodeHtml(html) {
            var txt = document.createElement("textarea");
            txt.innerHTML = html;
            return txt.value;
        }
        var ret={};
        var details=parsed.bizDetailsPageProps,x;
        var contact=details.bizContactInfoProps;
        ret.name=details.businessName;
        if(details.bizHoursProps) {
            ret.hours=details.bizHoursProps.hoursInfoRows;
        }
        if(details.fromTheBusinessProps) {
            ret.fromBusiness=details.fromTheBusinessProps.fromTheBusinessContentProps;
        }

        ret.businessInfoItems={};

        if(details.moreBusinessInfoProps&&details.moreBusinessInfoProps.businessInfoItems) {
            for(x of details.moreBusinessInfoProps.businessInfoItems) {
                ret.businessInfoItems[x.title]=decodeHtml(x.label);
            }
        }

        if(contact) {
            if(contact.businessWebsite && contact.businessWebsite.href) {
                ret.website=decodeURIComponent(contact.businessWebsite.href.replace("/biz_redir?url=","")).replace(/\&.*$/,""); }
            ret.phone=contact.phoneNumber;


        }

        if(details.mapBoxProps && details.mapBoxProps.addressLines) {
            ret.address="";
            let y;
            for(y of details.mapBoxProps.addressLines) {
                ret.address=ret.address+(ret.address.length>0?",":"")+y;
            }
        }

        return ret;
    }

    function parse_yelp(doc,url,resolve,reject) {
        /* Only parses restaurants properly at present, use other previous work to parse other things */
        var result={};
        var is_parsed=false;
        var yelp_re=/^\s*\<\!\-\-\s*(.*)\s*\-\-\>s*$/;
        var yelp_match,curr_script,parsed;
        for(curr_script of doc.scripts) {
            yelp_match="";
            if((yelp_match=curr_script.innerHTML.match(yelp_re))&&/footerProps/.test(yelp_match[1])) {
                try {
                    parsed=JSON.parse(yelp_match[1]);
                    result=parse_yelp_inner(parsed);
                    is_parsed=true;
                }
                catch(error) {
                    //reject("Error parsing JSON on YELP");
                    return;
                }
            }
            else if(true||!/^\s*\(function/.test(curr_script.innerHTML)) {
              /*  if(false&&yelp_match) {
                    try {
                        parsed=JSON.parse(yelp_match[1]);
                        if(parsed&&parsed.messages) parsed.messages="";
                        console.log("parsed="+JSON.stringify(parsed));
                    }
                    catch(error) {
                        console.log("not matched, curr_script.innerHTML="+curr_script.innerHTML);
                    }
                }
                else                 console.log("not matched, curr_script.innerHTML="+curr_script.innerHTML); */
            }

        }
        resolve(result);
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
            if(/^query$/.test(type) && b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                let parsed2=parse_b_context2(b_context);
                console.log("parsed_context="+JSON.stringify(parsed_context));
                console.log("parsed2="+JSON.stringify(parsed2));
                if(parsed2 && parsed2.restaurant) {
                    my_query.fields.restaurantyesno="Yes";
                    if(parsed2.restaurant.in_business) {
                        my_query.fields.openyesno="Yes";
                    }
                    if(parsed2.restaurant.Yelp) {
                        my_query.fields.yelp=parsed2.restaurant.Yelp.replace(/\?.*$/,"");;
                    }
                }

                else if(parsed_context.SubTitle||parsed_context["Hotel class"]) {
                    my_query.fields.openyesno="N/A";
                    my_query.fields.restaurantyesno="No";
                    my_query.submit_on_no=true;
                }

                if(parsed_context.url) {
                    my_query.fields.website=parsed_context.url; }
                if(parsed_context.Address&&parsed_context.Phone) {
                    my_query.fields.business_address=parsed_context.Address;
                    my_query.fields.business_phone=parsed_context.Phone; }

                add_to_sheet();
            }

            if(/^query$/.test(type) &&  lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                if(parsed_lgb.url && !MTP.is_bad_url(parsed_lgb.url,bad_urls,5,2)) my_query.fields.website=parsed_lgb.url;
                if(parsed_lgb.address&&parsed_lgb.phone) {
                    my_query.fields.business_address=parsed_lgb.address;
                    my_query.fields.business_phone=parsed_lgb.phone;
                }
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            if(/^query$/.test(type) && my_query.fields.website&&my_query.fields.business_address&&my_query.fields.openyesno==="Yes"&&
               my_query.fields.restaurantyesno==="Yes") {
                resolve("");
                return;
            }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                b_factrow=b_algo[i].querySelector(".b_factrow");
                if(/^yelp$/.test(type) && b_factrow) {
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/^query$/.test(type) && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) &&
                   !MTP.is_bad_name(my_query.name,b_name,p_caption,i) && (b1_success=true)) break;
                if(/^yelp$/.test(type) && (b1_success=true)) break;

            }
            if(/^query$/.test(type) && b1_success && (resolve({website:b_url})||true)) return;
            if(/^yelp$/.test(type) && b1_success && (resolve(b_url)||true)) return;

        }
        catch(error) {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;
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
        if(result&&result.website) my_query.fields.website=result.website;
        if(result&&result.address) my_query.fields.business_address=result.address;
        my_query.done.query=true;

        if(!my_query.fields.yelp) {
                    var search_str=my_query.name+" "+my_query.zip;

            const yelpPromise = new Promise((resolve, reject) => {
                console.log("Beginning Yelp search");
                query_search(search_str+" site:yelp.com", resolve, reject, query_response,"yelp");
            });
            yelpPromise.then(yelp_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
        }
        else {
            do_yelp();
//            my_query.done.yelp=true;
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
        var crowd_btn=document.querySelectorAll("crowd-radio-button");
        for(x of crowd_btn) x.checked=false;
      
        for(x in my_query.fields) {
          //  console.log("Trying to set field "+x);
            if(x==='business_phone') {

                let field=document.querySelectorAll("crowd-input[name='business_address']");
                if(field.length>1)  field[1].value=my_query.fields[x];
            }
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) {
                field.required=false;
                field.value=my_query.fields[x];
            }
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=false;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;

        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        console.log("pre, is_done="+is_done);
        if(!my_query.fields.restaurantyesno==="Yes"&&!my_query.submit_on_no) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            console.log("Failed to find some fields, my_query.fields="+JSON.stringify(my_query.fields));
            GM_setValue("returnHit"+MTurk.assignment_id,true);
        }
    }
    function yelp_promise_then(result) {
        if(!my_query.fields.yelp) my_query.fields.yelp=result.replace(/\?.*$/,"");
        do_yelp();
        submit_if_done();

    }

    function do_yelp() {
        console.log("in do_yelp, yelp="+my_query.fields.yelp);
        var promise=MTP.create_promise(my_query.fields.yelp,parse_yelp,parse_yelp_then,function(response) {
            console.log("Failed at yelp" +response);
        });
    }
    function parse_yelp_then(result) {
        if(result&&result.hours) {
            my_query.fields.restaurantyesno="Yes";
            my_query.fields.openyesno="Yes";
            console.log("parse_yelp_then,result="+JSON.stringify(result));
            var yelp_map={"Takes Reservations":"reservations","Take-out":"takeout","Delivery":"delivery","Waiter Service":"waiterservice",
                          "Accepts Credit Cards":"acceptscc","Alcohol":"alcohol"};
            var x;
            for(x in yelp_map) {
                if(result.businessInfoItems&&result.businessInfoItems[x]!==undefined) {
                    my_query.fields[yelp_map[x]]=result.businessInfoItems[x];
                }
                else {
                    my_query.fields[yelp_map[x]]="No";
                }
            }
            if(result.phone) my_query.fields.business_phone=result.phone;
            if(result.address) my_query.fields.business_address=result.address;
        }
        else {
           /* my_query.fields.restaurantyesno="No";
            my_query.fields.openyesno="N/A";
            my_query.fields.submit_on_no=true;*/
        }
        my_query.done.yelp=true;
        submit_if_done();
    }

    function init_Query() {
        console.log("in init_query");
        var i;
        bad_urls=default_bad_urls.concat(bad_urls);
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        var strong=document.querySelector("form div strong");
        var re=/^([^,]*)\s*,\s*(.*)$/,match;
        match=strong.innerText.match(re);

        my_query={name:match[1].trim(),zip:match[2].trim(),
                  fields:{website:"",business_address:"",yelp:"",restaurantyesno:"",openyesno:""},
                  done:{query:false,yelp:false},
                 
                  submit_on_no:false,
                  submitted:false};
        while(my_query.zip.length<5) my_query.zip="0"+my_query.zip;
        my_query.name=my_query.name.replace(/[\d]{5}[A-Z]$/,"")
            .replace(/-PLAN W\/O.*$/,"").trim();
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.zip;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });

    }

})();
