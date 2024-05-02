// ==UserScript==
// @name         TasteOftheWorldHours
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
// @grant GM_cookie
// @grant GM.cookie
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
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
    var day_map={"Monday":"MON","Tuesday":"TUE","Wednesday":"WED","Thursday":"THU","Friday":"FRI","Saturday":"SAT","Sunday":"SUN"};
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A2EILHT073BDZZ",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    AggParser.parse_yelp_noscript=function(doc,url,result) {
    var i;
    Object.assign(result,{closed:[],openTime:[],closeTime:[],
			  cleanOpenTime:[],cleanCloseTime:[],categories:"",bizinfo:"",city:"",state:""});
    var weekday, hours;
    var street_add=doc.getElementsByClassName("map-box-address");
    var day_map={"Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6};
    var biz_header=doc.getElementsByClassName("biz-page-header");
    var ywidget=doc.getElementsByClassName("ywidget");
    if(street_add.length>0) {
        var real_address=street_add[0].getElementsByTagName("address")[0].innerText;
        if(real_address.indexOf("\n")===-1) real_address="Fake Street\n"+real_address;
        real_address=real_address.replace(/\n/,",");
        real_address=real_address.replace(",Ft ",",Fort ").replace(" Bch "," Beach ").replace( "Ft "," Fort ");
        var new_add=parseAddress.parseLocation(real_address);
        console.log("new_add="+JSON.stringify(new_add));
        Object.assign(result,{city:new_add.city,state:new_add.state});

    }
    else  console.log("No street add found");
    for(i=0; i < 7; i++) {
        result.closed.push(false);
        result.openTime.push("");
	result.cleanOpenTime.push("");
        result.closeTime.push("");
	result.cleanCloseTime.push("");
    }
    var hours_t=doc.querySelectorAll("table[class^='hours-table']");

    if(hours_t.length>0) {
        console.log("hours_t=",hours_t[0].outerHTML);
        for(i=0; i < hours_t[0].rows.length; i++) {

            try {
                if(hours_t[0].rows[i].cells.length<2) continue;
              console.log("row=",hours_t[0].rows[i].innerText);
                weekday=hours_t[0].rows[i].cells[0].innerText;
                console.log("weekday=",weekday);
                console.log("hours=",hours);
                let select_elem_open=document.querySelector("select."+weekday.toUpperCase()+".open");
            let select_elem_close=document.querySelector("select."+weekday.toUpperCase()+".closed");
                hours=hours_t[0].rows[i].cells[1].innerText;
                if(hours.indexOf("Closed")!==-1) result.closed[day_map[weekday]]=true;
                if(hours.indexOf("Open 24")!==-1)
                {

                    result.openTime[day_map[weekday]]="12:00 am";
                    result.closeTime[day_map[weekday]]="12:00 am";
                }
                else if(hours.indexOf("-")!==-1)
                {
                    var the_split=hours.split(/\s*-\s*/);
                    console.log("the_spans=",the_split);
                    result.openTime[day_map[weekday]]=AggParser.fix_yelp_time(the_split[0]);
                    select_elem_open.value=AggParser.fix_yelp_time(the_split[0]);
                    result.cleanOpenTime[day_map[weekday]]=the_split[0].trim();
                    result.closeTime[day_map[weekday]]=AggParser.fix_yelp_time(the_split[1]);
                    select_elem_close.value=AggParser.fix_yelp_time(the_split[1]);
                    result.cleanCloseTime[day_map[weekday]]=the_split[1].trim();

                }
                else  console.log("Error parsing time");
            }
            catch(e) { console.log("e=",e); }
        }

    }
    else {
        console.log("Can't find hours table poo");
    }
    if(biz_header.length>0) {
        var cat_str=biz_header[0].getElementsByClassName("category-str-list");
        if(cat_str.length>0) result.categories=cat_str[0].innerText;
    }
    for(i=0; i < ywidget.length; i++) {
        var h3=ywidget[i].getElementsByTagName("h3");
        if(h3.length>0 && h3[0].innerText.indexOf("More business info")!==-1) {
            var ylist=ywidget[i].getElementsByClassName("ylist");
            if(ylist.length>0) result.bizinfo=ylist[0].innerText;
        }
    }
    my_query.done_time=true;
    console.log("result="+JSON.stringify(result));
};

    MTurkScript.prototype.parse_hours_table=function(table) {
        var row,col;
        console.log("table=",table);
        var hours_dict={};
        for(row of table.tBodies[0].rows) {
            if(row.cells.length>=2) {
                var split_times=row.cells[1].innerText.trim().split(/ - /);
                if(split_times.length>=2) {

                    split_times[0]=split_times[0].replace(/Noon/i,"12:00 PM").replace(/Midnight/i,"12:00 AM")
                        .replace(/^(\d+) /,"$1:00 ").replace(/^(\d:)/,"0$1").replace(/(AM|PM).*$/,"$1");
                    split_times[1]=split_times[1].replace(/Noon/i,"12:00 PM").replace(/Midnight/i,"12:00 AM").replace(/^(\d+) /,"$1:00 ").replace(/^(\d:)/,"0$1")
                        .replace(/(AM|PM).*$/,"$1");

                    var open24=MTurkScript.prototype.convertTime12to24(split_times[0]), close24=MTurkScript.prototype.convertTime12to24(split_times[1]);

                    var curr_dict={"open":split_times[0],"close":split_times[1],"open24":open24,"close24":close24,"closed":false};

                    hours_dict[row.cells[0].innerText.trim()]=curr_dict;
                }
                else if(/Closed/i.test(row.cells[1].innerText)) {
                    hours_dict[row.cells[0].innerText.trim()]={"closed":true};
                }
                else {
                    if(/24 hours/i.test(row.cells[1].innerText)) {
                       let curr_dict={"open":"12:00 AM","close":"12:00 AM","open24":"00:00","close24":"24:00","closed":false};

                        hours_dict[row.cells[0].innerText.trim()]=curr_dict;
                    }
                    else {
                        console.error("Error parsing hours dict, found ", row.cells[1].innerText, " as time"); }
                }


            }
        }
        return hours_dict;
    }

    /**
 * TODO: Yelp doesn't grab stuff for non-restaurants now
 */

AggParser.parse_yelp_inner=function(parsed) {
    console.log("in parse_yelp_inner");
    function decodeHtml(html) {
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }
    var ret={},y;
    var details=parsed.bizDetailsPageProps,x;
    var contact=details.bizContactInfoProps;
    ret.name=details.businessName;
    if(details.bizHoursProps) ret.hours=details.bizHoursProps.hoursInfoRows;
    if(details.fromTheBusinessProps) ret.fromBusiness=details.fromTheBusinessProps.fromTheBusinessContentProps;
    ret.businessInfoItems={};
    if(details.moreBusinessInfoProps&&details.moreBusinessInfoProps.businessInfoItems) {
        for(x of details.moreBusinessInfoProps.businessInfoItems) {
            ret.businessInfoItems[x.title]=decodeHtml(x.label);
        }
    }

    if(contact) {
        if(contact.businessWebsite && contact.businessWebsite.href) {
            ret.website=decodeURIComponent(contact.businessWebsite.href.replace("/biz_redir?url=",""))
		.replace(/\&.*$/,""); }
        ret.phone=contact.phoneNumber;
    }

    if(details.mapBoxProps && details.mapBoxProps.addressLines) {
        ret.address="";
        for(y of details.mapBoxProps.addressLines) ret.address=ret.address+(ret.address.length>0?",":"")+y;
    }

    return ret;
};

AggParser.parse_yelp=function(doc,url,resolve,reject) {
    /* Only parses restaurants properly at present, use other previous work to parse other things */
    var result={},is_parsed=false;
    var yelp_re=/^\s*\<\!\-\-\s*(.*)\s*\-\-\>s*$/;
    var yelp_match,curr_script,parsed;
    AggParser.parse_yelp_noscript(doc,url,result);
    console.log("afterwards, result=",result);
    resolve(result);
};


    function add_parsed_table_to_sheet(parsed_table) {
        console.log("parsed_table=",parsed_table);
        var day;
        for(day in parsed_table) {
            console.log("day=",day);
            let select_elem_open=document.querySelector("select."+day_map[day]+".open");
            let select_elem_closed=document.querySelector("select."+day_map[day]+".closed");
            select_elem_closed.options[select_elem_closed.options.length-1].value="23:30";

            if(parsed_table[day].closed) {
                select_elem_open.value="00:00";
                select_elem_closed.value="00:00";
            }
            else {
                select_elem_open.value=parsed_table[day].open24.replace(":45",":30").replace(":15",":00").replace(":50",":30")
                console.log("parsed_table[day].close24=",parsed_table[day].close24);
                /*if(parsed_table[day].close24=="23:30") {
                    console.log("select_elem_closed.options=",select_elem_closed.options);
                    select_elem_closed.value=select_elem_closed.options[select_elem_closed.options.length-1].value;
                }*/
                select_elem_closed.value=parsed_table[day].close24.replace(":45",":30").replace(":15",":00").replace(":50",":30").replace("23:59","24:00");

            }
        }
        my_query.done_time=true;
    }

    function add_24_hours_to_sheet() {
        var day;
        for(day in day_map) {
            console.log("day=",day);
            let select_elem_open=document.querySelector("select."+day_map[day]+".open");
            let select_elem_closed=document.querySelector("select."+day_map[day]+".closed");
            select_elem_closed.options[select_elem_closed.options.length-1].value="23:30";


                select_elem_open.value="00:00";
                select_elem_closed.value="24:00";

        }
        my_query.done_time=true;
    }


    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption, parsed_b_ans;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb, b_ans;
        try
        {
            search=doc.getElementById("b_content");
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            b_ans=doc.querySelector(".b_ans.b_top");

            console.log("b_algo.length="+b_algo.length);
                        var opHoursTable=doc.querySelector(".opHours table");
            if(type==="query") {
            if(opHoursTable) {
                let parsed_table=MTP.parse_hours_table(opHoursTable);
                add_parsed_table_to_sheet(parsed_table);
                my_query.done.query=true;
                submit_if_done();
                return;
            }
            if(doc.querySelector(".opHours .e_green.b_positive")) {
                add_24_hours_to_sheet();
                                my_query.done.query=true;

                submit_if_done();
                return;
            }
            }
	    if(type==="query" && b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.closed) {
                my_query.done_time=true;

                document.querySelector("textarea").value="CLOSED "+response.finalUrl;
                resolve("");
                return;
            }
				

           
				} 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); 
				
            }
                var openHours=doc.querySelector('[id^="OpenHours"]');

            if(doc.querySelector("#permanently_Closed")) {
                my_query.done_time=true;

                document.querySelector("textarea").value="CLOSED "+response.finalUrl;
                resolve("");
                return;
            }


        console.log("openHours=",openHours);
             for(i=0; i < b_algo.length&&i<2; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("h2 a").href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
  if(type==="yelp" && /yelp\.com\/biz\//.test(b_url)
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
        if(type==="query" && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+" "+my_query.address+" "+my_query.city,resolve,reject,query_response,"query");
            return;
        }

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
        my_query.done.query=true;
            submit_if_done();
            return;
        console.log("result=",result);
        
    }

    function yelp_promise_then(result) {
        if(/yelp\.com/.test(result)) {
            var yelp_promise=MTP.create_promise(result,AggParser.parse_yelp,parse_yelp_then,function() { GM_setValue("returnHit",true); });
        }
    }

    function parse_yelp_then(result) {
        console.log("parse_yelp_then,result=",result);
                    my_query.done.yelp=true;
        console.log("my_query.done=",my_query.done);
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
        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && my_query.done_time&& !my_query.submitted && (my_query.submitted=true)) {
            if(GM_getValue("automate")) {
                document.querySelector(".submitButton").click();
            }
            MTurk.check_and_submit();
        }
        else if(is_done_dones && !my_query.submitted) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
		bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var p=document.querySelectorAll("section div p")[1];
        var p_split=p.innerText.trim().split("\n");
        var colon_re=/^[^:]*:\s*/;
        my_query={name,fields:{},done:{"query":false,"yelp":true},done_time:false,
		  try_count:{"query":0},
		  submitted:false};
        my_query.name=p_split[1].replace(colon_re,"");
        my_query.address=p_split[2].replace(colon_re,"");
        my_query.city=p_split[3].replace(colon_re,"").replace(/United States/,"").replace(/, [^,]* County,/,",");
	console.log("my_query="+JSON.stringify(my_query));
        var search_str = my_query.name+" "+my_query.address+" "+my_query.city+" hours"
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=true; submit_if_done() });
       /* const yelpPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" "+my_query.address+" "+my_query.city+" site:yelp.com", resolve, reject, query_response,"yelp");
        });
        yelpPromise.then(yelp_promise_then)
            .catch(function(val) {
            console.log("Failed at this yelpPromise " + val); my_query.done.yelp=true; submit_if_done(); });*/
    }

})();