// ==UserScript==
// @name         Ryan DohertyHours
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  One off Find Hours
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/a1689a4ee6c7246bdd38d0a682e1c3da7f9fe021/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/8dbe5ae86a621d3961b48d9456e53afbac533300/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,1250+(Math.random()*1000),[],begin_script,"A3PAQ0J9VM3Y0U",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }
    function fix_phone(str) {
        let temp_str;
        temp_str=str.replace(/[^\d]*/g,"").replace(/^1/,"");
        if(temp_str.length===10) {
            return temp_str.substring(0,3)+"-"+temp_str.substr(3,3)+"-"+temp_str.substr(6,4);
        }
        else return str;
    }

    function parse_opHours(opHours) {
        var ret={};
        var day_list=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        var table=opHours.querySelector("table");
        var curr_row,i,x;
        var ampm_re=/^([\d]+) (AM|PM)/;
        var time_split,opentime,closetime;
        if(!table) return {"failed":true};
        for(i=1;i<table.rows.length;i++) {
            curr_row=table.rows[i];
            time_split=curr_row.cells[1].innerText.split(/\s+\-\s+/);
            if(time_split.length===2) {
                opentime=time_split[0].trim().replace(ampm_re,"$1:00 $2");
                closetime=time_split[1].trim().replace(ampm_re,"$1:00 $2");
                ret[curr_row.cells[0].innerText.trim()]={"open":opentime,"close":closetime,"closed":false};
            }
//
        }
        for(x of day_list) {
            if(ret[x]===undefined) {
                ret[x]={"open":"closed","close":"closed","closed":true}; }
        }
        return ret;
    }

    // if it has #mh_cdb_datagroupid_openhours that's what should be sent
    function parse_BingHours(otherHours) {

        var content=otherHours.nextElementSibling;
        var timeTable=content.querySelector("table"),row;
        if(!timeTable) return {"failed":true};
        return parse_bingTimeTable(timeTable);

    }

    function parse_bingTimeTable(timeTable) {
        var ret={},x,row;
        var day_list=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        var prev={"begin":"","end":""};
        for(row of timeTable.rows) prev=parse_bingTimeRow(ret,row,prev);
        for(x of day_list) if(ret[x]===undefined) ret[x]={"open":"closed","close":"closed","closed":true};
        return ret;

    }

    function parse_bingTimeRow(ret,row,prev) {
        var day_abbr_list=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        var day_list=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        var days=row.cells[0].innerText.trim();
        var begin_day,end_day,open,close,i;
        var adding=false;
        var doing_prev=false;
        var times=row.cells[1].innerText.trim();
        var split_days=days.split(/\s+\-\s+/),split_times=times.split(/\s+\-\s+/);
        if(split_days.length===1) {
            if(split_days[0].trim().length===0&&prev.begin) {
                console.log("Did PREV,prev="+JSON.stringify(prev));
                doing_prev=true;
                begin_day=prev.begin;
                end_day=prev.end;
            }
            else begin_day=end_day=split_days[0];
        }
        else if(split_days.length===2) {
            begin_day=split_days[0];
            end_day=split_days[1];
        }
        else return;
        if(split_times.length!=2) return;
        open=split_times[0].trim();
        close=split_times[1].trim();
        for(i=0;i<day_abbr_list.length;i++) {
            if(begin_day===day_abbr_list[i]) adding=true;
            if(adding&&!doing_prev) ret[day_list[i]]={"open":open,"close":close,"closed":false};
            else if(adding&&doing_prev&&my_query!==undefined) {
                console.log("ret="+JSON.stringify(ret)+", ret["+day_list[i]+"]="+JSON.stringify(ret[day_list[i]]));
                my_query.fields.Notes+=(my_query.fields.Notes.length>0?",":"")+" closed on "+day_abbr_list[i]+" from "+ret[day_list[i]].close+
                    " to "+open;
                ret[day_list[i]].close=close;
            }

            if(end_day===day_abbr_list[i]) adding=false;
        }
        return {"begin":begin_day,"end":end_day};
    }
    function setHours(hours,priority) {
        var day_list=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        var x;
        if(my_query.hours_priority>priority) return;
        for(x of day_list) {
            my_query.fields[x+"Open"]=hours[x]?hours[x].open:"closed";
            my_query.fields[x+"Closed"]=hours[x]?hours[x].close:"closed";
        }
        my_query.hours_priority=priority;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,parsed_factrow,opHours,parsed_opHours;
        var otherHours,parsed_otherHours;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            opHours=doc.querySelector("span.opHours");
            if(/^query$/.test(type) && opHours && (parsed_opHours=parse_opHours(opHours))) {
                console.log("parsed_opHours="+JSON.stringify(parsed_opHours)); }
            else if(/^query$/.test(type) && (otherHours=doc.querySelector("#mh_cdb_datagroupid_openhours")) &&
               (parsed_otherHours=parse_BingHours(otherHours))) {
                console.log("parsed_otherHours="+JSON.stringify(parsed_otherHours));
                setHours(parsed_otherHours,1);
                resolve("");
                return;
            }
            else if(/^query$/.test(type)) {
                let b_subModule=doc.querySelectorAll(".b_subModule"),curr_sub,h2,timeTable;
                console.log("b_subModule.length="+b_subModule.length);
                for(curr_sub of b_subModule) {
                    if((h2=curr_sub.querySelector("h2")) && /Hours/.test(h2.innerText)&&(timeTable=curr_sub.querySelector("table"))) {
                        parsed_otherHours=parse_bingTimeTable(timeTable);
                        console.log("parsed_otherHours="+JSON.stringify(parsed_otherHours));
                        setHours(parsed_otherHours,1);
                        resolve("");
                        return;
                    }
                }

            }

            console.log("b_algo.length="+b_algo.length);
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));    
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb));             
            }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
               
              if(/^canpages$/.test(type) &&
                 /canpages\.ca\//.test(b_url) && !MTP.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;
                if(/^facebook$/.test(type) && i<2 &&
                 /facebook\.com\//.test(b_url) && !MTP.is_bad_fb(b_url) && !MTP.is_bad_name(b_name,my_query.name,p_caption,i) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(/^query$/.test(type) && parsed_context && parsed_context.Yelp) {
            resolve(parsed_context.Yelp);
            return;
        }
        do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        let search_str;
        if(/^query$/.test(type) && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            search_str=my_query.name+" "+my_query.city+" "+my_query.province;
            query_search(search_str, resolve, reject, query_response,"query");
            return;

        }
        if(/^query$/.test(type) && my_query.try_count[type]===1) {
            my_query.try_count[type]++;
            search_str=my_query.name.replace(/\s-.*$/,"")+" "+my_query.address;
            query_search(search_str, resolve, reject, query_response,"query");
            return;

        }
        reject("Nothing found "+type);
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
        if(result.length>0) {
            my_query.yelp_url=result;
            var promise=MTP.create_promise(my_query.yelp_url,AggParser.parse_yelp,parse_yelp_then,function() {
                my_query.done.query=true; submit_if_done(); });
            return;
        }
        my_query.done.query=true;
        console.log("my_query.fields="+JSON.stringify(my_query.fields));
        submit_if_done();
    }

    function fb_promise_then(result) {
        my_query.fb_url=result;
        my_query.fb_about_url=my_query.fb_url.replace(/(facebook\.com\/[^\/]+).*$/,"$1")
            .replace(/facebook\.com\//,"facebook.com/pg/").replace(/\/$/,"")+"/about/?ref=page_internal";
        console.log("my_query.fb_about_url="+my_query.fb_about_url);
        var fb_promise=MTP.create_promise(my_query.fb_about_url,MTP.parse_FB_about,parse_fb_about_then);
    }
    function hr24_replacer(match,p1,p2) {
        let num=parseInt(p1);
        if(num===24||num<=11) {
            return match+" AM";
        }
        else {
            num=num-12;
            if(num===0) num=12;
            return num+":"+p2+" PM";
        }
    }
    function fix_24hr_time(time) {
        time=time.replace(/^([^:]*):([\d]*).*$/,hr24_replacer);
        return time;
    }

    function parse_fb_about_then(result) {
        console.log("result="+JSON.stringify(result));
        var good_hrs={};
        var x;
        if(result.hours&&result.hours.Monday) {
            for(x in result.hours) {
                good_hrs[x]={"open":result.hours[x].open?fix_24hr_time(result.hours[x].open):"closed",
                             "close":result.hours[x].close?fix_24hr_time(result.hours[x].close):"closed",
                             "closed":result.hours[x].closed};
            }
            console.log("good_hrs="+JSON.stringify(good_hrs));
            setHours(good_hrs,5);

        }
        my_query.done.fb=true;
        submit_if_done();
    }


    function canpages_promise_then(result) {
        console.log("canpages url="+result);
        my_query.canpages_url=result;
        let promise=MTP.create_promise(my_query.canpages_url,parse_canpages,parse_canpages_then,function() {
            my_query.done.canpages=true;
            submit_if_done(); });
//        my_query.done.canpages=true;
  //      submit_if_done();
    }
    function parse_yelp_then(result) {
        console.log("parse_yelp_then,result="+JSON.stringify(result));
        var day_list=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        var adding_stuff=false,x,i;
        for(x of result.cleanOpenTime) if(x&&x.length>0) adding_stuff=true;
        if(adding_stuff) {
            for(i=0;i<day_list.length;i++) {
                if(result.closed[i]) my_query.fields[day_list[i]+"Open"]=my_query.fields[day_list[i]+"Closed"]="closed";
                else {
                    my_query.fields[day_list[i]+"Open"]=result.cleanOpenTime[i];
                    my_query.fields[day_list[i]+"Closed"]=result.cleanCloseTime[i];
                }
            }
        }
        my_query.done.query=true;
        submit_if_done();
    }

    function parse_canpages(doc,url,resolve,reject) {
        var module=doc.querySelectorAll(".module"),title,content;
        var curr_module;
        for(curr_module of module) {
            title=curr_module.querySelector(".module__title");
            content=curr_module.querySelector(".module__content");
            if(title && /HOURS/i.test(title.innerText)&&content) {
                parse_canpages_content(content);
                resolve("");
                return;
            }
        }
        resolve("");

    }
    function parse_canpages_content(content) {
        var p=content.querySelectorAll("p"),x;
        var day_list=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        var hours={};
        var found_match;
        var p_re=/^([A-Za-z]+)\s([^\-]*)\s+\-\s+([^\-]*)/,match;
        for(x of p) {
            //console.log("x.innerText.trim()="+x.innerText.trim());
            if(match=x.innerText.trim().match(p_re)) {
                found_match=true;
              //  console.log("match="+JSON.stringify(match));
                hours[match[1].trim()]={open:match[2].trim(),close:match[3].trim()};
            }
        }
        console.log("canpages: hours="+JSON.stringify(hours));
        if(found_match) setHours(hours,3);
    }

    function parse_canpages_then(result) {
        my_query.done.canpages=true;
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
            if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
        }
    }


    function submit_if_done() {
        var is_done=true,x,is_done_dones=false;
        add_to_sheet();
        console.log("my_query.done="+JSON.stringify(my_query.done));
        for(x in my_query.done) {
  //          console.log("my_query.done["+x+"]="+my_query.done[x]);
            if(!my_query.done[x]) is_done=false;
//            console.log("is_done="+is_done);
        }
    //    console.log("is_done="+is_done);
        is_done_dones=is_done;
        if(!my_query.fields.MondayOpen) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            console.log("Failed, "+JSON.stringify(my_query.done));
            GM_setValue("returnHit"+MTurk.assignment_id,"true");
        }
    }

    function init_Query()
    {
        var panelbody=document.querySelector(".panel-body");
        panelbody.parentNode.removeChild(panelbody);
        console.log("in init_query");
        var i;
                var wT=document.querySelectorAll("form section table")[0];
      //  var a=document.querySelectorAll("form a");
        var add_re=/,\s*([^,]*),\s*([^,]*),\s*Canada\s*$/,match;
        my_query={name:wT.rows[1].cells[0].innerText,address:wT.rows[2].cells[0].innerText.trim(),city:"",province:""
                  ,fields:{Notes:""},
                  done:{query:false,canpages:false,fb:false},
		  try_count:{"query":0},
                  hours_priority:-1,
		  submitted:false};

        my_query.parsed_add=new Address(my_query.address);
        if((match=my_query.address.match(add_re))) {
            my_query.city=match[1];
            my_query.province=match[2];
        }
        my_query.address=my_query.address.replace(/,\s*Canada\s*$/,"");
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" "+my_query.address;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=true;
        submit_if_done();
        });
        const canpagesPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" canpages.ca", resolve, reject, query_response,"canpages");
        });
        canpagesPromise.then(canpages_promise_then)
            .catch(function(val) {
            console.log("Failed at this canpagesPromise " + val); my_query.done.canpages=true;
        submit_if_done();
        });
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" facebook.com", resolve, reject, query_response,"facebook");
        });
        fbPromise.then(fb_promise_then)
            .catch(function(val) {
            console.log("Failed at this fbPromise " + val); my_query.done.fb=true;
        submit_if_done();
        });
    }

})();
