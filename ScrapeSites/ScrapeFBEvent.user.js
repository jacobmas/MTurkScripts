// ==UserScript==
// @name         ScrapeFBEvent
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Emil Paulsson
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://worker.mturk.com/*
// @include https://www.facebook.com*
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
    var MTurk,MTP;
    if(!/facebook.com/.test(window.location.href)) {
        MTurk=new MTurkScript(20000,200,[],begin_script,"AHF2EZZ0364Z3",false);
        MTP=MTurkScript.prototype;
    }
    else {
        begin_fb();
    }
    function is_bad_name(b_name)
    {
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
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
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
        var is_done=true,x,is_done_dones;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.result) if(!my_query.result[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones&&!is_done) {
            console.log("Failed, returning");
            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;
        }

    }
    function parse_date(to_parse) {
       var date_map={"January":"01","February":"02","March":"03","April":"04","May":"05","June":"06","July":"07","August":"08","September":"09",
                     "October":"10","November":"11","December":"12"};
        var date_map2={"Jan":"01","Feb":"02","Mar":"03","Apr":"04","May":"05","Jun":"06","Jul":"07","Aug":"08","Sep":"09",
                     "Oct":"10","Nov":"11","Dec":"12"};
        var split=to_parse.split(" at "),ret={date:"",time:""};
        var date_re=/([^\s]*) ([^,]*),\s*(.*)$/,date_match,time_re=/([^\s]*)\s+([^\s]*)/,time_match;
        date_match=split[0].match(date_re);
        time_match=split[1].match(time_re);
                console.log("Glunk0");
        var mapped_date=date_map[date_match[1]]?date_map[date_match[1]]:date_map2[date_match[1]];
        ret.date=date_match[3]+"-"+mapped_date+"-"+(date_match[2].length===1?"0":"")+date_match[2];
        var hr=parseInt(time_match[1].split(":")[0]);
        console.log("Glunk1");
        var min=time_match[1].split(":").length>1?time_match[1].split(":")[1]:"00";
        if(time_match[2]==="PM" && hr<12) hr+=12;
                console.log("Glunk2");

        var str_hr=hr.toString();
        ret.time=(str_hr.length<2?"0":"")+str_hr+":"+min;
         console.log("Glunk3");

        return ret;
    }
    function parse_FB_event_ret() {
       // console.log("IN parse_FB_event_ret, arguments="+JSON.stringify(arguments));
        var result=arguments[2],x,field,ret,datefield,timefield,new_x;
        my_query.result=result;
        for(x in result) {
            field=document.getElementById(x);
            console.log("x="+x+", "+field+", "+JSON.stringify(result[x]));
            if(field) field.value=result[x];
            else if(x==="FBstarttime"||x==="FBendtime") {
                new_x=x.replace(/FB/,"").replace(/time/,"").replace(/^([a-z])(.*)$/,function(match,p1,p2) { return p1.toUpperCase()+p2 });
                console.log("new_x="+new_x);
                ret=parse_date(result[x]);
                console.log("ret="+JSON.stringify(ret));
                datefield=document.getElementById(new_x+"date");
                timefield=document.getElementById(new_x+"time");
                if(datefield) {
                    console.log("datefield add");
                    datefield.value=ret.date;
                }
                if(timefield) {
                    console.log("timefield add");
                    timefield.value=ret.time;
                }

            }
        }
        submit_if_done();

    }

   
    function get_hrs_str(val) {
        return (val<10?"0":"")+val.toString();
    }
    function get_next_day(dateval,begin_date) {
        console.log("DATEVAL="+JSON.stringify(dateval));
        var months=/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/;
        var month_list=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        var mon=dateval[1],day=dateval[2],year=dateval[3];
        var intday=parseInt(day),intyear=parseInt(year);
        var mon_index=month_list.indexOf(mon);
        console.log("mon="+mon+", day="+day+", year="+year+", mon_index="+mon_index);
        if(mon_index!==-1 && ((/Apr|Jun|Sep|Nov/.test(mon) && intday===30)||
        (/Jan|Mar|May|Jul|Aug|Oct/.test(mon) && intday===31) ||
                              (/Feb/.test(mon) &&
                              ((intyear%4===0 && (intyear%100!==0 || intyear%400===0) && intday===29)||(
            (!(intyear%4!==0 && (intyear%100!==0 || intyear%400===0)) && intday===29)))))) {
            console.log("last of month");
            return month_list[mon_index]+" 1, "+year;
        }
        if(mon_index===11 && intday===31) {
                        console.log("last of year");

            return "Jan 1, "+(year+1);
        }
        console.log("not last of month");

        return mon+" "+(intday+1).toString()+", "+year;
    }
    function parse_FB_times(result,content,text) {
        var UTC_re=/UTC(.*)$/,UTC_match,UTC_int=0;
        var content_re=/^([^\s]*)\sto\s([^\s]*)$/,content_match,begin_str,end_str;
        var text_re=/^([^,]+),\s*([^–]*)\s*–\s*(.*)\s*UTC(.*)$/,match;
        var text_re2=/^([^–]+)\s*–\s*(.*)\s*UTC(.*)$/;
        if((UTC_match=text.match(UTC_re))) UTC_int=parseInt(UTC_match[1]);
        function replace_time(match,p1,p2) {
            intp1=parseInt(p1);
            p1=p1+4+UTC_int;
            return get_hrs_str(p1)+":"+p2;
        }
        if((match=text.match(text_re))) {

           // begin_str=content_match[1].replace(/([\d]{2}):([\d]+)$/,replace_time);
           // end_str=content_match[1].replace(/([\d]{2}):([\d]+)$/,replace_time);
            result.FBstarttime=match[2];
            var begin_date=match[2].replace(/\sat\s.*$/,""),date_match;
            var end_date;
            var date_re=/^([^\s]*)\s([\d]*),\s*([\d]+)/;
            if((date_match=begin_date.match(date_re)) && match[3].match(/ AM/) && match[2].match(/PM/)) {
                end_date=get_next_day(date_match,begin_date);
            }
            else end_date=begin_date;

            console.log("end_date="+end_date);

            result.FBendtime=end_date+" at "+match[3];
        }
        else if((match=text.match(text_re2))) {
            result.match=match;
           // begin_str=content_match[1].replace(/([\d]{2}):([\d]+)$/,replace_time);
           // end_str=content_match[1].replace(/([\d]{2}):([\d]+)$/,replace_time);
            result.FBstarttime=match[1].trim().replace(/ at/,","+new Date().getFullYear()+" at");
            let begin_date=match[1].replace(/\sat\s.*$/,""),date_match;
            let end_date;
            let date_re=/^([^\s]*)\s([\d]*),\s*([\d]+)/;
            if((date_match=begin_date.match(date_re)) && match[3].match(/ AM/) && match[1].match(/PM/)) {
                end_date=get_next_day(date_match,begin_date);
            }
            else end_date=begin_date;

            console.log("end_date="+end_date);

            result.FBendtime=match[2].trim().replace(/ at/,","+new Date().getFullYear()+" at");
        }
        else {
            console.log("failed, content_match="+content_match+", match="+match);
        }




    }

    function begin_parse_FB_event() {
        var desc,times;
        if((desc=document.querySelector("._63ew"))&&(times=document.querySelector("._2ycp"))) {
            parse_FB_event();
            return;
        }
        else if(my_query.count<30) {
            console.log("my_query.count="+(my_query.count++));
            setTimeout(begin_parse_FB_event,500);
        }
        else {
            console.log("FAiled fb");
        }
    }

    function parse_FB_event() {
        var result={"FBeventid":"","FBeventtitle":"","FBeventhost":"","FBcoverimg":"","FBstarttime":"","FBendtime":"",
                   "FBeventdecription":""};
        var regex=/facebook\.com\/events\/([\d]*)/,match,title,img,desc,times;
        if((match=window.location.href.match(regex))) result.FBeventid=match[1];
        if((title=document.querySelector("._5gmx"))) result.FBeventtitle=title.innerText.trim();
        if((img=document.querySelector("._3ojl img"))&&img.src!==undefined) result.FBcoverimg=img.src;
        var host
        var content_match;
        if(host=document.querySelector("._3xd0 a._5xhk")) result.FBeventhost=host.href;
        else if(host=document.querySelector("._b9- a")) result.FBeventhost=host.href;

        if((times=document.querySelector("._2ycp")))
        {
            console.log("times.outerHTML="+times.outerHTML);
            content_match=times.outerHTML.match(/content\=\"([^\"]*)\"/);
            if(content_match) {
                console.log("Parsing fb_times "+content_match[1]+", "+times.innerText);
                parse_FB_times(result,content_match[1],times.innerText);
            }
        }
        if((desc=document.querySelector("._63ew"))) result.FBeventdecription=desc.innerText;
        GM_setValue("fb_event_ret",result);
    }
        /* if we're on the right page */
    /* begin parsing fb */
    function begin_fb() {
        //GM_setValue("fb_event_url","");
        GM_addValueChangeListener("fb_event_url",function() {
            my_query.fb_event_url=arguments[2];
            window.location.href=my_query.fb_event_url;
        });
        if(GM_getValue("fb_event_url","")===window.location.href && /\/events\//.test(window.location.href)) {
            my_query.count=0;
            begin_parse_FB_event();
        }
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var dont=document.getElementsByClassName("dont-break-out");
        my_query={fb_event_url:dont[0].href,fields:{},done:{},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
         GM_setValue("fb_event_url","");
       /* var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/
        GM_addValueChangeListener("fb_event_ret",parse_FB_event_ret);
        GM_setValue("fb_event_url",my_query.fb_event_url);

    }



})();