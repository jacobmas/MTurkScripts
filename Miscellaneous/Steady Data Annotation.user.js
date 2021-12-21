// ==UserScript==
// @name         Steady Data Annotation
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find Number of Employees
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
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(60000,1000+(Math.random()*750),[],begin_script,"A3HT4YR8P03M55",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function matches_names(name1,name2,city,state) {
        var lname1=name1.replace(/([,\.]|(\&\s*))/g,"").replace(/\s{2,}g/," ").toLowerCase().trim();
        var lname2=name2.replace(/([,\.]|(\&\s*))/g,"").replace(/\s{2,}g/," ").toLowerCase().trim();
        console.log(`lname1=${lname1}, lname2=${lname2}`);
        if(lname1===lname2) return true;
        console.log(`city=${city}, my_query.city=${my_query.city}, equality=${city===my_query.city}`);
        console.log(`state=${state}, my_query.state=${my_query.state}, equality=${state===my_query.state}`);

        if(MTP.matches_names(name1,name2) && city && state && city.toLowerCase()===my_query.city.toLowerCase() && state.toLowerCase()===my_query.state.toLowerCase()) return true;
        return false;

    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb, parsed_factrow={};
        var result={address_list:[]};
        try
        {
            search=doc.getElementById("b_content");
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
               // console.log("parsed_context="+JSON.stringify(parsed_context));
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                 //   console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
            }
            for(i=0; i < b_algo.length; i++) {
                if(i>1 && type!="query") break;
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");

                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                     if(b_factrow=b_algo[i].querySelector(".b_factrow")) {
                    parsed_factrow=MTP.parse_b_factrow(b_factrow);
                    if(parsed_factrow.Location) {
                        parsed_factrow.Location=parsed_factrow.Location.replace(/, ([\d\-]{5,10}), ([A-Z]{2})\s*$/,", $2 $1");
                        let temp_add=new Address(parsed_factrow.Location);
                        console.log("parsed_factrow, temp_add=",temp_add);
                        if(temp_add&&temp_add.city&&temp_add.state) result.address_list.push(temp_add);
                    }
                    console.log("parsed_factrow=",parsed_factrow);
                }
                if(/query/.test(type)) {
                    let query_name="";
                    if(/opencorporates\.com/.test(b_url) && (query_name=b_name.replace(/::.*$/,"").trim()))
                    {
                        let corp_regex=/(?:\(company number \d+\)\,|Agent Address) (.* [A-Z]{2},? [\d\-]{5,})/i,corp_match;// 4201 MARATHON BLVD STE 201, AUSTIN, TX, 78756-3409
                        console.log("opencorporates, query_name=",query_name);

                        if(matches_names(my_query.name,query_name)&&(corp_match=p_caption.match(corp_regex))) {
                            let temp_add=new Address(corp_match[1]);
                            result.address_list.push(temp_add);
                            console.log("opencorporates, result=",result);
                        }
                    }
                    if(/bizapedia\.com/.test(b_url) && (query_name=b_name.replace(/ in(?:\s[A-Z][a-z\-]*){1,}, [A-Z]{2}.*$/,"").trim())) {
                        console.log("bizapedia, query_name=",query_name);

                        let biz_match,biz_regex=/ and is located at (.*)\.?$/;
                        if(matches_names(my_query.name, query_name)&&(biz_match=p_caption.match(biz_regex))) {
                            let temp_add=new Address(biz_match[1].replace(/\.$/,""));
                            result.address_list.push(temp_add);
                            console.log("opencorporates, result=",result);

                        }
                                             //   console.log("bizapedia, query_name=",query_name);

                    }
                    if(/dandb\.com/.test(b_url) && (query_name=b_name.replace(/\s-\s.*$/,"").trim())) {
                                                console.log("dandb, query_name=",query_name);

                        let temp_emp_match=p_caption.match(/ has ([\d,]+) employees/);
                        if(matches_names(my_query.name,query_name) && temp_emp_match) {
                            my_query.field_dict.query={"NumberEmployees":temp_emp_match[1].replace(/,/g,""),"URL":b_url};


                       }
                    }
                    if(/dnb\.com/.test(b_url) && (query_name=b_name.replace(/Company Profile \|?.*$/,"").trim())) {
                        console.log("dnb, query_name=",query_name);


                        if(matches_names(my_query.name,query_name) && parsed_factrow.Employees) {
                            my_query.field_dict.query={"NumberEmployees":parsed_factrow.Employees,"URL":b_url};


                        }
                    }
                }

                    /*&& !MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;*/
                if(/zoominfo/.test(type)) {
                     console.log("MOO");
                     var temp_name=b_name.replace(/:.*$/,"").replace(/\s-.*$/,"").trim();
                    temp_name=b_url.match(/\/(?:c|pic)\/([^\/]*)\//);
                     console.log(`Found zoominfo,temp_name=${temp_name}`);

                     if(temp_name && matches_names(my_query.name, temp_name[1].replace(/\-/g," "))) {
                         resolve({url:b_url, caption:p_caption});
                         return;
                     }
                 }
                 if(/^dnb$/.test(type)) {
                     console.log("MOO");
                     let temp_name=b_name.replace(/Company Profile \|?.*$/,"").trim();
                     console.log(`Found dnb,temp_name=${temp_name}`);
                     let temp_add=b_name.replace(/^[^\|]*\|\s*([^\|]*)(\s\|.*$|.*$)/,"$1");
                     temp_add=temp_add.replace(/\s*\.*\s*$/,"");
                     console.log("temp_add=",temp_add);
                     let temp_split=temp_add.split(/, /);
                     let temp_city,temp_state;
                     temp_city=temp_split[0];
                     temp_state=temp_split.length>1?temp_split[1]:"";


                     if(matches_names(my_query.name, temp_name, temp_city, temp_state)) {
                         resolve({url:b_url, caption:p_caption});
                         return;
                     }
                 }
                if(/^cortera$/.test(type)) {
                     console.log("cortera");
                     let temp_match=b_name.match(/^([A-Z\s]+)\s([A-Za-z\s\-]+)\s([A-Z]{2}),/,"");
                     console.log(`Found cortera,temp_match=${temp_match}`);
                    if(temp_match.length<=3) continue;
                     let temp_name=temp_match[1],temp_city=temp_match[2],temp_state=temp_match[3];


                     if(matches_names(my_query.name, temp_name, temp_city, temp_state)) {
                         resolve({url:b_url, caption:p_caption});
                         return;
                     }
                 }
                 if(/^apollo$/.test(type)) {
                     console.log("apollog");
                     let temp_match=b_name.replace(/\s\-\s.*$/,"");
                     console.log(`Found apollo,temp_match=${temp_match}`);

                     if(matches_names(my_query.name, temp_match, "","")) {
                         resolve({url:b_url, caption:p_caption});
                         return;
                     }
                 }

            }
            if((/query/.test(type) || b1_success) && (resolve(result)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        var search_str;
        if(my_query.try_count[type]===0 && type==="dnb") {
            my_query.try_count[type]++;
            search_str="\""+my_query.name+"\" "+(my_query.city?my_query.city+" ":"")+" site:dnb.com";
            query_search(search_str, resolve, reject, query_response,"dnb");
            return;
        }
              else  if(my_query.try_count[type]===0 && type==="dnb") {
            my_query.try_count[type]++;
            search_str="\""+my_query.name+"\" site:dnb.com";
            query_search(search_str, resolve, reject, query_response,"dnb");
            return;
        }
        else if(my_query.try_count[type]===2 && type==="dnb") {
            my_query.try_count[type]++;
            query_search(my_query.name+" site:dnb.com", resolve, reject, query_response,"dnb");
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
        console.log("query result=",result);
        if(result.url&&result.factrow&&result.factrow.Employees) {
            //my_query.field_dict.query={"NumberEmployees":result.factrow.Employees,"URL":result.url};
        }
        if(result.address_list&&result.address_list.length>0) {
            my_query.city=result.address_list[0].city;
            my_query.state=result.address_list[0].state;
        }
        my_query.done.query=true;
        do_other_queries();
        //submit_if_done();
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
        var x,field,y;


        var field_quality_priority=["dnb","zoominfo","query","apollo","cortera"];

        for(x of field_quality_priority) {
            if(my_query.field_dict[x]!==undefined) {
                for(y in my_query.field_dict[x]) {
                    my_query.fields[y]=my_query.field_dict[x][y];
                }
                break;
            }
        }

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
        if(is_done && !my_query.submitted && (my_query.submitted=true)) {
            console.log("my_query.field_dict=",my_query.field_dict);

            MTurk.check_and_submit();
        }
        else if(is_done_dones) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function parse_zoominfo(doc,url,resolve,reject) {
        console.log("parse_zoominfo, url=",url);
        var item_div=doc.querySelectorAll("div.icon-text-wrapper");
        var x;
        for(x of item_div) {
            let p=x.querySelector("p");
              if(p && p.innerText.match(/Website/)) {
                var a=x.querySelector("a").href;
                if(!my_query.fields.website) my_query.fields.website=a;

               }
            if(p && p.innerText.match(/Employees/)) {
                var employee_div=x.querySelector("span").innerText.replace(/[^\d,]+/g,"");
                my_query.field_dict.zoominfo={"NumberEmployees":employee_div,"URL":url};

                my_query.fields.NumberEmployees=employee_div;
                my_query.fields.URL=url;
                resolve("");
            }

        }
        reject("");

    }

    function parse_zoominfo_then() {
        my_query.done.zoominfo=true;
            submit_if_done();
    }

    function dnb_promise_then(data) {
        console.log("dnb result=",data);
        let employee_re=/ has ([\d\,]+) total employee/;
        let employee_match=data.caption.match(employee_re);
            if(employee_match) {
                my_query.fields.NumberEmployees=employee_match[1].replace(/,/g,"");
                my_query.fields.URL=data.url;
                my_query.field_dict.dnb={"NumberEmployees":employee_match[1].replace(/,/g,""),"URL":data.url};

                my_query.done.dnb=true;
                submit_if_done();
            }
        else {
            console.log("Failed DNB match");
            var promise=MTP.create_promise(data.url,parse_dnb, function() { my_query.done.dnb=true; submit_if_done(); }, function() { my_query.done.dnb=true; submit_if_done(); })
//            GM_setValue("returnHit",true);
        }
    }

    function cortera_promise_then(result) {
        console.log("cortera_promise_then,result=",result);
        var cortera_re=/has (?:approximately )?([\d,]+) to ([\d,]+) (?:…|employees)/;
        var cortera_match=result.caption.match(cortera_re);
        if(cortera_match) {
            my_query.field_dict.cortera={"NumberEmployees":cortera_match[1]+"-"+cortera_match[2],"URL":result.url};
            my_query.done.cortera=true;
            submit_if_done();
        }
        else {
            var promise=MTP.create_promise(result.url,parse_cortera, function() { my_query.done.cortera=true; submit_if_done(); }, function () { my_query.done.cortera=true; submit_if_done(); });
        }

    }

    function parse_cortera(doc,url,resolve,reject) {

        var details=doc.querySelectorAll(".company-details"),match;
        console.log("parse_cortera,details=",details);
        var detail;
        for(detail of details) {
            if(detail && (match=detail.innerText.match(/Employees:\s*([\d,]+)\s+to\s+([\d,]+)/))) {
                my_query.field_dict.cortera={"NumberEmployees":match[1]+"-"+match[2],"URL":url};

            }
        }
        resolve("");
    }

    function apollo_promise_then(result) {
        var promise=MTP.create_promise(result.url,parse_apollo, function() { my_query.done.apollo=true; submit_if_done(); }, function () { my_query.done.apollo=true; submit_if_done(); });

    }

    function parse_apollo(doc,url,resolve,reject) {
        var item=doc.querySelectorAll("[role='listitem']");
        var x,title,info;
        for(x of item) {
            title=x.querySelector("[class^='ContactSegment__ContactTitle']");
            info=x.querySelector("[class^='ContactSegment__ContactInfo']");
                        console.log("title=",title," info=",info);

            if(title&&info&&/Employees/.test(title.innerText)) {
                my_query.field_dict.apollo={"NumberEmployees":info.innerText.trim(),"URL":url};
            }
        }
        resolve("");
    }

    function parse_dnb(doc,url,resolve,reject) {
        var result={url:url,employee_list:[]};
        var span=doc.querySelector("[name='employees_all_site'] span");
        var address,phone,website,name,temp,title;
        var span_list=['address','phone','name'],x;
        if(!span) span=doc.querySelector("[name='employees_this_site'] span");
        if((address=doc.querySelector("[name='company_address'] span"))) {
            result.address=new Address(address.innerText.replace(/United States\s*$/,"").trim());
        }
        for(x of span_list) {
            if((temp=doc.querySelector(`[name='company_${x}'] span`))) {
                result[x]=temp.innerText.trim();
            }
        }
        if((temp=doc.querySelector(`[name='revenue_in_us_dollar'] span`))) {
            result.revenue=temp.innerText.trim();
        }

        var people=doc.querySelectorAll("[itemtype='https://schema.org/Person']");
        for(x of people) {
            name=x.querySelector("[itemprop='name']");
            title=x.querySelector("[itemprop='jobTitle']");
            result.employee_list.push({name:name?name.innerText.trim():"",title:title?title.innerText.trim():""});

        }


        if(span) {
            result.employees=span.innerText.trim();
            my_query.field_dict.dnb={"NumberEmployees":span.innerText.trim(),"URL":url};
            console.log("result=",result);
            resolve("");
            return;
        }
        reject("");
    }

     function zoominfo_promise_then(data) {
        let employee_re=/ and has ([\d\,]+) employee/;
        let employee_match=data.caption.match(employee_re);
        if(employee_match) {
            my_query.fields.NumberEmployees=employee_match[1].replace(/,/g,"");
            my_query.fields.URL=data.url;

            my_query.field_dict.zoominfo={"NumberEmployees":employee_match[1].replace(/,/g,""),"URL":data.url};
            my_query.done.zoominfo=true;
            submit_if_done();
        }
        else {
            console.log("Failed match");
            var promise=MTP.create_promise(data.url,parse_zoominfo, parse_zoominfo_then, function() { my_query.done.zoominfo=true; submit_if_done(); })
//            GM_setValue("returnHit",true);
        }
    }

    function do_other_queries(result) {
        var search_str="\""+my_query.name+"\" number of employees";


        const zoominfoPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:zoominfo.com", resolve, reject, query_response,"zoominfo");
        });
        zoominfoPromise.then(zoominfo_promise_then)
            .catch(function(val) {
            console.log("Failed at this zoominfoPromise " + val); my_query.done.zoominfo=true; submit_if_done(); });

        const dnbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:dnb.com", resolve, reject, query_response,"dnb");
        });
        dnbPromise.then(dnb_promise_then)
            .catch(function(val) {
            console.log("Failed at this zoominfoPromise " + val); my_query.done.dnb=true; submit_if_done(); });
         const corteraPromise = new Promise((resolve, reject) => {
            console.log("Beginning cortera search");
            query_search("\""+my_query.name+"\""+" site:start.cortera.com", resolve, reject, query_response,"cortera");
        });
        corteraPromise.then(cortera_promise_then)
            .catch(function(val) {
            console.log("Failed at this corteraPromise " + val); my_query.done.cortera=true; submit_if_done(); });

        const apolloPromise = new Promise((resolve, reject) => {
            console.log("Beginning cortera search");
            query_search("\""+my_query.name+"\""+" site:apollo.io", resolve, reject, query_response,"apollo");
        });
        apolloPromise.then(apollo_promise_then)
            .catch(function(val) {
            console.log("Failed at this apolloPromise " + val); my_query.done.apollo=true; submit_if_done(); });
    }


    function init_Query()
    {
        console.log("in init_query");
        var i;
       var name=document.querySelector("crowd-form div div  div").innerText.replace(/[^:]*:\s*/,"").trim();
        my_query={name:name,city:"",state:"",fields:{NumberEmployees:"",URL:""},done:{zoominfo:false,query:false,dnb:false,cortera:false},field_dict:{},
		  try_count:{"query":0,"dnb":0,"zoominfo":0},
		  submitted:false};

        	console.log("my_query="+JSON.stringify(my_query));

        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search("\""+my_query.name+"\"", resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); query_promise_then({}); });

    }

})();