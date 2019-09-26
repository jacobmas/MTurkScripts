// ==UserScript==
// @name         RyanTaylor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adapted from TaylorFodor to scrape baseball coaches
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


// VCF Do something with?
(function() {
    'use strict';
  // var url_list=GM_getValue("url_list");
   // if(url_list===undefined) url_list=[];
    var MTurk=new MTurkScript(35000,1200,[],begin_script,"AHOMAUZ3UJ3TQ",false);
    var MTP=MTurkScript.prototype;
    //var automate=GM_getValue("automate",false);
    var phone_re=/([(]?[0-9]{3}[)]?[-\s\.\/]+)?[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var new_phone_re=/Phone: ([(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;
    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {},first_try=true;
    var email_list=[];
    var bad_urls=["facebook.com","instagram.com","twitter.com","yelp.com","webnode.com","en.wikipedia.org","collegefactual.com","timeshighereducation.com"];
    var sport_map1={
        "Baseball":["baseball","m-basebl"],"Field Hockey":["fhockey","fhock"],"Football":["football"],"Men's Basketball":["mbball"],
        "Men's Rowing":["mrow"],"Men's Soccer":["msoc"],"Men's Swimming": ["mswim","swimming","swim","msd"],
        "Men's Diving":["mswimdive","mswim","swimming","swim","swimdive","m-swim","msd","mdive"],"Men's Golf":["mgolf"],"Men's Lacrosse":["mlax"],"Men's Water Polo":["mwpolo"],
        "Men's Tennis":["mten"],"Men's Track":["mtrack","mxctf","track","tf","trackandfield"],"Softball":["softball"],"Women's Basketball":["wbball"],
        "Women's Diving":["wswim","swimming","swim","wsd","wdive"],"Women's Golf":["wgolf"],"Women's Lacrosse":["wlax"],
        "Women's Rowing":["wrow"],"Women's Soccer":["wsoc"],"Women's Swimming":["wswim","swimming","swim","wsd"],
        "Women's Volleyball":["wvball","vball","volleyball"],"Women's Tennis":["wten"],"Women's Track":["wtrack","wxctf","track","tf","trackandfield"],
        "Wrestling":["wrestling"],"Men's Wrestling":["wrestling"]};
    var sport_map1a={"Field Hockey":"fhock"};
    var sport_map2={"Baseball":["bsb"],"Field Hockey":["fh"],"Football":["fball","m-footbl"],"Men's Basketball":["mbkb","m-baskbl"],
                    "Men's Diving":["mswimdive","mswim","swim","swimdive","m-swim"],"Men's Lacrosse":["mlax"],"Men's Soccer":["msoc","m-soccer"],
                    "Men's Swimming":["mswimdive","mswim","swim","swimdive","m-swim"],"Men's Tennis":["mten"],"Men's Track":["mtrack","mtrack-out","m-track"],
                    "Men's Water Polo": ["mwaterpolo"],"Men's Wrestling":["wrest"],"Softball":["sball"],"Women's Basketball":["wbkb","w-baskbl"],
                    "Women's Diving":["wswim","wswimdive","swim","swimdive","w-swim"],"Women's Lacrosse":["wlax"],"Women's Soccer":["wsoc","w-soccer"],
                    "Women's Swimming":["wswim","wswimdive","swim","swimdive","w-swim"],"Women's Tennis":["wten"],"Women's Track":["wtrack","wtrack-out"],
                    "Women's Volleyball":["wvball","w-volley"]};

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

    function hex_at(str, index) {
        return parseInt(str.substr(index, 2), 16);
    }
    function decryptCloudFlare(ciphertext) {
        var output = "";
        var key = hex_at(ciphertext, 0);
        for(var i = 2; i < ciphertext.length; i += 2) {
            var plaintext = hex_at(ciphertext, i) ^ key;
            output += String.fromCharCode(plaintext);
        }
        output = decodeURIComponent(escape(output));
        return output;
    }

    function bad_email_url(to_check) {
        let i;
        for(i=0; i < bad_urls.length; i++)
        {
            if(to_check.indexOf(bad_urls[i])!==-1) return true;
        }
        return false;
    }
  /*  function check_and_submit() {
        console.log("Checking and submitting");
        MTurk.check_and_submit();
       // if(GM_getValue("automate")) setTimeout(function() { document.getElementById("submitButton").click(); }, 500);
       return true;
    }*/
    function is_bad_url(the_url) {
        for(var i=0; i < bad_urls.length; i++) if(the_url.indexOf(bad_urls[i])!==-1) return true;
        return false;
    }
    function validateEmail(email) {
        return email_re.test(String(email).toLowerCase());
    }
    function validatePhone(phone) {
        var new_re=/^\d{3,11}/;
        return new_re.test(new_str);
    }
    function parse_name_func(text) {
        var split_str,fname,lname,appell=[/^Mr.\s*/,/^Mrs.\s*/,/^Ms.\s*/,/^Miss\s*/,/^Dr.\s*/];
        for(var i=0; i < appell.length; i++) text=text.replace(appell[i],"");
        return text.replace(/^([^,]+),\s*(.*)$/,"$2 $1");
    }
    function strip_null_blank(str_array) {
        var ret_array=[];
        for(var i=0; i < str_array.length; i++)
        {
            var curr_str=str_array[i];
            if(curr_str!==null && curr_str!==undefined && curr_str.length>0 && curr_str.indexOf(".jpg")===-1) ret_array.push(curr_str.replace(/^([^:]*:)/,""));
        }
        return ret_array;
    }
    function do_data_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain"),id=e.target.name;
        var id_val=id.match(/[\d]+/)[0];
        var id_int=parseInt(id_val),i,j;
        if(document.getElementById("mult_rows").checked) {
            var split_str_temp=strip_null_blank(text.split(/\s*\n\s*/)),split_str=[],curr_str="";
            var lines_row=parseInt(document.getElementById("lines_row_select").value);
            for(i=0; i < split_str_temp.length; i+= lines_row) {
                curr_str="";
                for(j=0; j < lines_row; j++) {
                    if(j>0) curr_str=curr_str+"\t";
                    curr_str=curr_str+split_str_temp[i+j]; }
                split_str.push(curr_str);
            }
            for(i=0; i < split_str.length && i < 20; i++) {
                if(split_str[i]!==null && split_str[i]!==undefined && split_str[i].length>0 && data_paste_func(split_str[i],id_int)) id_int=id_int+1;
            }
        }
        else data_paste_func(text,id_val);
    }
    function setField(field, id,value) {
        if(value===undefined) return;
        if(/phone/i.test(field) && (/x/.test(value) || /ext:/i.test(value)) &&
           my_query.phone&&my_query.phone.length>0) value=my_query.phone+" "+value;
        if(/phone/i.test(field) && (value=value.replace(/[\t\n]+/g,"")) && phone_re.test(value) &&
           value.length>=8) value=value.match(phone_re)[0];
        if(/email/i.test(field)) {
            if(value=value.match(email_re)) value=value[0];
            else value="";
        }
        var nameVal=field+" (Coach #"+id+")";
        console.log("Setting field "+nameVal+" with "+value);
        document.getElementsByName(field+" (Coach #"+id+")")[0].value=value;
    }
    function data_paste_func(text, id_val) {
        add_fields(Gov.parse_data_func(text),id_val);
    }
    function add_fields(ret, id_val) {
        if(id_val<1 || id_val > 10) return;
        ret.name=ret.name.replace(/\'[\d]{2}.*$/,"")
            .replace(/^([^,]*),\s*(.*)$/,"$2 $1").replace(/^Dr.\s*/,"");
        if(my_query.phonePrefix.length>0 && ret.phone.trim().length>0) ret.phone=my_query.phonePrefix+ret.phone;
        if((/(x|ext:)/i.test(ret.phone))) ret.phone=(my_query.phone?my_query.phone+" ":"")+ret.phone;
        var fullname=MTurkScript.prototype.parse_name(ret.name.trim());
        if(my_query.fields.contactname==="" || /^\s*Head/i.test(ret.title)) {
            Object.assign(my_query.fields,{contactname:MTP.proper_name_casing(ret.name),role:MTP.proper_name_casing(ret.title),phone:ret.phone||"",email:ret.email||""});
        }
        add_to_sheet();
    }
    function is_sport_index(url, additional) {
        var the_sports=sport_map2[my_query.sport],i;
        if(the_sports===undefined) return false;
        for(i=0; i < the_sports.length; i++) {
            if((additional!==undefined && additional.length>0 && url.indexOf("/sports/"+the_sports[i]+"/"+additional+"/index")!==-1) ||
               ((additional===undefined || additional.length===0) && url.indexOf("/sports/"+the_sports[i]+"/index")!==-1)) return true;
        }
        return false;
    }

     /* Rewriting to have a determine page type thing to break up massive sports_response */
    function determine_page_type(doc,url,resolve,reject) {
        var sidearm=doc.getElementsByClassName("sidearm-table"),j,temp_var="";
        var begin_url=url.replace(/(https?:\/\/[^\/]+).*$/,"$1/")
        if(sidearm!==null && sidearm!==undefined && sidearm.length>0) {
            if(url.indexOf("coaches.aspx?path=")!==-1) {
                parse_sidearm2(doc,url,resolve,reject,sidearm[0]);
                return;
            }
            else if(parse_sidearm(doc,url,resolve,reject,sidearm[0])&&(resolve("")||true)) return;
            else if(!my_query.doneReparse) {
                my_query.doneReparse=true;
                let reparse_promise=MTP.create_promise(begin_url+"staff.aspx",sports_response,resolve,reject);
                return;
            }
            else return;
        }
        else if(/\/directory\/index/.test(url) && doc.getElementById("mainbody")!==null && parse_info_directory(doc,url,resolve,reject)) return;
        if(/\/directory\/staff/.test(url) && parse_info_directory_staff(doc,url,resolve,reject)) return;
        if(/\/staff\.php/.test(url)) {
            let staff;
            console.log("staff.php, doc.body.innerText="+doc.getElementById("staff-list"));
            if(doc.getElementById("staff-list")!==null) return parse_staff_php(doc,url,resolve,reject,doc.getElementById("staff-list"));
            if((staff=doc.querySelector(".staff"))) return parse_php_table(doc,url,resolve,reject,staff);
        }
        if(is_sport_index(url,"coaches")) return parse_sports_index(doc,url,resolve,reject);
        else if(doc.getElementsByClassName("staff_dgrd").length>0) {
            console.log("Found staff_dgrd");
            var script=doc.getElementById("ctl00_contentDiv").getElementsByTagName("script");
            for(j=0; j < script.length; j++) { if(script[j].innerHTML.indexOf("loadRow")!==-1) break; }
            if(j>=script.length) j=0;
            return parse_staff_dgrd(doc,url,resolve,reject,doc.getElementsByClassName("staff_dgrd")[0],"staff",script[j]);
        }
        else if((temp_var=doc.getElementsByClassName("coaches_dgrd")).length>0) return parse_staff_dgrd(doc,url,resolve,reject,temp_var[0],"coaches");
        else if(url.indexOf("/athletics/staff")!==-1 && url.indexOf("/athletics/staff.")===-1
                && url.indexOf("/athletics/staff-")===-1 && url.indexOf("/athletics/staff_")===-1
                && url.indexOf("/athletics/staffdirectory")===-1) return parse_athletics_staff(doc,url,resolve,reject);
        if(url.indexOf(".dbml")!==-1) return parse_dbml(doc,url,resolve,reject);
        else if(url.indexOf("hometeamsonline.com")!==-1) return parse_hometeamsonline(doc,url,resolve,reject);
        else if(doc.getElementById("staffdir")) return parse_staffdir(doc,url,resolve,reject);
        else if(doc.getElementsByClassName("coach-bios").length>0) return parse_coachbios(doc,url,resolve,reject);
        else if(doc.getElementsByClassName("staffBioWrapper").length>0) return parse_staff_bio_wrapper(doc,url,resolve,reject);
        else if((doc.getElementsByClassName("view-coaches").length>0 ||
            doc.getElementsByClassName("view-contact-persons").length>0)) return parse_view_coaches(doc,url,resolve,reject);

        else if(doc.getElementsByClassName("dataTables_scrollHead").length>0) return parse_scrollHead(doc,url,resolve,reject);
        else if(doc.getElementsByClassName("staff-department").length>0 && parse_staff_department(doc)&&(resolve("")||true)) return true;
        else if(/\/staff-directory/.test(url) && parse_staff_dash_directory(doc,url)&&(resolve("")||true)) return true;
        else if(doc.getElementsByClassName("staff-directory").length>0) return parse_staff_directory(doc,url,resolve,reject);
        else { x=parse_generic(doc,url,resolve,reject);
             console.log("x="+x);
              return x;
             }

    }


    function sports_response(doc,url,resolve,reject) {
       
        if(my_query.submitted) return;
        var i,j,k,temp_var;
        var begin_url=url.replace(/(https?:\/\/[^\/]+).*$/,"$1/"),new_url="";
        console.log("in sports_response, url="+url);
        my_query.last_good_url=url;
        find_address_generic(doc,url);
        if(url.indexOf("sorry.ashx")!==-1 && !my_query.doneSorry) {
            my_query.doneSorry=true;
            let sorry_promise=MTP.create_promise(url.replace("sorry.ashx","staff.aspx"),sports_response,resolve,reject);
            return;
            return;
        }
        var page_parse_promise=new Promise((resolve,reject) => {
            determine_page_type(doc,url,resolve,reject);
        })
        .then(function(response) {
            console.log("response, submitting if done");
            submit_if_done(); })
        .catch(function(response) {
            page_failed_catch(doc,url,resolve,reject,response); });
    }
    /* If we failed to parse the page */
    function page_failed_catch(doc,url,resolve,reject) {
        var i,j;
        var found_dbml=false,dbml_url="",new_url="";
        var begin_url=url.replace(/(https?:\/\/[^\/]+).*$/,"$1/");
        if(my_query.try_count===0) {
            console.log("Found nothing, my_query.try_count="+my_query.try_count);
            //console.log("doc.body.innerHTML="+doc.body.innerHTML);
            my_query.try_count++;
            var links=doc.links,has_edu=url.indexOf(".edu")!==-1;
            for(i=0; i < links.length; i++) {

                links[i].href=MTP.fix_remote_url(links[i].href,url);
                let my_sportresult=sport_map1[my_query.sport.trim()];
                if(/\.dbml/.test(links[i].href) && (found_dbml=true)) dbml_url=links[i].href;
                console.log("# my_sportresult="+JSON.stringify(my_sportresult)+", sport="+my_query.sport);
                if(my_sportresult!==undefined) {
                    for(j=0; j < my_sportresult.length; j++) {
                        if((links[i].href.indexOf(".aspx?path="+my_sportresult[j])!==-1
                            && !new RegExp("\\.aspx\\?path\\="+my_sportresult[j]+"[A-Za-z]+").test(links[i].href))
                           ||
                           links[i].href.indexOf("staff.aspx?path="+my_sportresult[j])!==-1) {
                            console.log("Found good links[i] for path="+my_sportresult[j]);
                            new_url=links[i].href.replace("index.aspx","coaches.aspx").replace("staff.aspx","coaches.aspx");
                            new_url=begin_url+"/coaches.aspx?path="+my_sportresult[j];
                            console.log("new_url="+new_url);
                            break;
                        }
                    }
                }
                if(new_url.length>0) break;
                if(links[i].href.indexOf("index.aspx?path=")!==-1 ||
                   links[i].href.indexOf("staff.aspx?path=")!==-1) console.log("links["+i+"].href="+links[i].href);
                else if(is_sport_index(links[i].href,"")) {
                    console.log("Found sports indexy thing");
                    new_url=links[i].href;
                    if(new_url.indexOf("coaches")===-1) new_url=new_url.replace(/\/index/,"/coaches/index");
                }
                else if(links[i].href.indexOf("staff.php")!==-1) {
                    console.log("Found staff.php");
                    new_url=begin_url+"staff.php";
                    break;
                }
                else if(has_edu && !my_query.doneRedirect &&
                        (links[i].innerText.toLowerCase().indexOf("athletics")!==-1 &&
                         links[i].href.toLowerCase().indexOf("www."+get_domain_only2(begin_url.toLowerCase()))===-1 &&
                         !/mailto:\s*/.test(links[i].href)) ||
                        (!my_query.doneCoaches && /coaches/i.test(links[i].innerText) && /athletics/i.test(links[i].href.toLowerCase()))) {
                    console.log("Found new url="+links[i].href);
                    if(/coaches/i.test(links[i].innerText)) my_query.doneCoaches=true;
                    my_query.try_count=0;
                    my_query.doneRedirect=true;
                    new_url=links[i].href;
                    break;
                }
                if((/directory$/.test(links[i].href) || /Staff Directory/i.test(links[i].innerText)) &&
                   !(/Faculty Directory/i.test(links[i].innerText))) {
                    console.log("Found directory");
                    new_url=links[i].href;
                }
            }
            console.log("Done looping, try_count="+my_query.try_count);
            if(found_dbml&&new_url.length===0) {
                new_url=dbml_url.replace(/\/[^\/]+\.dbml.*$/,"/StaffDirectory.dbml");
                console.log("new_url from dbml="+new_url);
            }
            if(new_url.length===0 && !my_query.doneRedirect) {
                new_url=begin_url;//response.finalUrl.replace(/\/[^\/]+\/?$/,"")
                my_query.try_count=0;
                my_query.doneRedirect=true;
                console.log("Nothing found to do, trying redirect");
            }
            if(new_url.length>0) {
                console.log("new_url="+new_url+", redirecting");
                let new_url_promise=MTP.create_promise(new_url,sports_response,resolve,reject);
                return;
            }
            console.log("Can do nothing now");
            var search_str=get_domain_only2(my_query.url) +" athletics "; // -site:.edu";
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning query seaxrch");
                query_search(search_str, resolve, reject, query_response,"query");
            });
            queryPromise.then(query_promise_then).catch(function(val) { return; });
        }
        else if(my_query.try_count>0) {
            console.log("Truly failed");
            let search_str=get_domain_only2(my_query.url) +" athletics "// -site:.edu";
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning query search");
                query_search(search_str, resolve, reject, query_response,"query");
            });
            queryPromise.then(query_promise_then).catch(function(val) { return; });
            return;
        }
    }
    function add_gov_contacts() {
        var i,ctr=1,found_coach=false,prof_count=0;
        console.log("Gov.contact_list="+JSON.stringify(Gov.contact_list));
        if(Gov.contact_list.length===0) return false;
        for(i=0; i < Gov.contact_list.length;i++) {
            if(/(^|\s|,|\.)(Coach)($|\s|,|\.)/.test(Gov.contact_list[i].title)) found_coach=true;
            if(/(^|\s|,|\.)(Professor)($|\s|,|\.)/i.test(Gov.contact_list[i].title)) prof_count++;
        }
        if(!found_coach || prof_count>3) return false;
        for(i=0; i < Gov.contact_list.length; i++) {
            if(ctr>10) break;
            if(/(^|\s|,|\.)(Coach|Specialist|Director|Operations|Coordinator)($|\s|,|\.)/.test(Gov.contact_list[i].title)) {
                add_fields(Gov.contact_list[i],ctr++);
            }
        }
        if(ctr>1) {
            submit_if_done();
            return true;
        }
        return false;
    }

    function parse_sid_help(doc,url,resolve,reject) {
        var s_names=doc.querySelectorAll(".#sid-primary-menu .sport-name"),x;
        for(x of s_names) {
            if(is_right_sport(x.innerText.trim())) {
                x.href=MTP.fix_remote_url(x.href,url);
                let promise;
            }
        }
    }

    function parse_staff_dash_directory(doc,url,resolve,reject) {
        console.log("In parse_staff_dash_directory");
         var i,j,roster,table;
        var h3=doc.querySelectorAll("h2,h3");
        for(i=0;i<h3.length;i++) {
            if(is_right_sport(h3[i].innerText) && h3[i].nextElementSibling && (table=h3[i].nextElementSibling.querySelector("table"))) {
                return parse_info_directory_table(doc,url,resolve,reject,table,-1,table.rows.length,{0:"name",1:"title",2:"phone",3:"email"});
            }
        }
        return false;
    }

    function parse_generic(doc,url,resolve,reject) {
       // return false;
        console.log("\n**** DOING parse_generic ****\n");
        console.log("my_query="+JSON.stringify(my_query));
        var staffdir=doc.getElementsByTagName("table");
        if(staffdir.length===0) {
            console.log("no staffdir found");

        }
        console.log("To try");
        var the_table,temp_table,typeTitle,curr_row,curr_cell,begin_row,end_row;
        var i,j,x,k;
        var links=doc.links;
        let good_link="";
        for(x of links) {
            //console.log("pre x.href="+x.href);
          //  console.log("x.outerHTML="+x.outerHTML);

            x.href=MTP.fix_remote_url(x.href,url);
              //          console.log("post x.href="+x.href);

            //console.log("parse_generic: x.innerText="+x.innerText);
            if(x.href.toLowerCase().indexOf(my_query.short_sport.toLowerCase())!==-1 && is_right_sport(x.innerText)) {
                console.log("FOUND SPORT");
                my_query.has_sport=true;
                good_link=x.href;
                my_query.fields.teamsite=good_link;
                break;
            }
        }

        if(good_link) {
            console.log("## good_link="+good_link);
                    var dept_regex_lst=[/Coach/];

            var title_regex_lst=[/Admin|Administrator|Supervisor|Manager|Director|Founder|Owner|Officer|Secretary|Assistant|Coach/i];
            //var promise=MTP.create_promise(
            var query={dept_regex_lst:dept_regex_lst,
                       title_regex_lst:title_regex_lst,id_only:false,default_scrape:false,debug:false};
         //   Gov.query=query;
            /*let promise=MTP.create_promise(good_link,find_coach_generic,resolve,reject);
            return;*/


         /* let promise=MTP.create_promise(good_link,Gov.init_Gov,function(result) {
                parse_gov_result(result,resolve,reject); },function(response) {

                console.log("Fucked up Gov.init_Gov "+ response);
                reject(""); },query);*/
        }
       /* for(i=0; i < staffdir.length; i++)
        {
            the_table=staffdir[i];
            typeTitle=the_table.getElementsByTagName("th");
            if(typeTitle.length===0)  typeTitle=the_table.querySelectorAll('td[colspan="4"]');
            if(typeTitle.length===0) typeTitle=the_table.querySelectorAll('td[colspan="3"]');
            if(typeTitle.length===0) typeTitle=the_table.querySelectorAll('td[colspan="5"]');
            if(typeTitle.length>0 && !/Directory/i.test(typeTitle[0].innerText)) {
                console.log("i="+i+", calling parse_generic_inner");
                if(parse_generic_inner(doc,typeTitle[0].parentNode.parentNode,typeTitle)) return true;
            }
            else {
                for(j=0; j < the_table.rows.length; j++) {
                    if((curr_row=the_table.rows[j]).length<2) continue;
                    curr_cell=curr_row.cells[0].innerText;
                    if(is_right_sport(curr_cell) && (begin_row=j)) {
                        curr_row.cells[0].innerHTML="Name";
                        for(k=j+1; k <the_table.rows.length; k++) {
                            if(the_table.rows[k].cells.length>1 &&
                               curr_row.cells[1].innerText===the_table.rows[k].cells[1].innerText) break;
                        }
                        end_row=k;
                        console.log("begin_row="+begin_row+", end_row="+end_row);
                        return parse_generic3(the_table,begin_row+1,end_row);
                    }
                }
            }
        }*/
        var result=Gov.parse_contact_elems(doc,url);
        console.log("result="+JSON.stringify(Gov.contact_list));
        for(x of Gov.contact_list) {
            if(x.title.toLowerCase().indexOf(my_query.short_sport.toLowerCase())!==-1) {
                console.log("Found on x="+JSON.stringify(x));
                add_fields(x,1);
                my_query.fields.coachsite=url;
                resolve("success");
            }
        }
        //if(add_gov_contacts()) return true;
        //var promise=find_sports_page(doc,url);
       // promise.then(function() { return true; }).catch(function() { return false; });
        if(the_table===undefined) reject("failed parse_generic");
       return false;//parse_generic2(the_table);*/
    }

    function parse_gov_result(result,resolve,reject) {
        console.log("Gov.contact_list="+JSON.stringify(Gov.contact_list));
        reject("");
    }


    /* TODO? */
    function find_coach_generic(doc,url,resolve,reject) {
        console.log("find_coach_generic,url="+url);
        var links,x;
        var coach_re=/(^(Coaches|Coach Staff|Coach)$)|(the Coaches$)/i;
        for(x of doc.links) {
            x.href=MTP.fix_remote_url(x.href,url);
          //  console.log("coach_generic,x.innerText="+x.innerText);
            if(x.innerText.match(coach_re)) {
                my_query.fields.coachsite=x.href;
                let promise=MTP.create_promise(x.href,Gov.load_scripts,function(result) {
                    parse_gov_result(result,resolve,reject);
                },reject);
                return;
            }
        }
        let promise=MTP.create_promise(url,Gov.load_scripts,function(result) {
                    parse_gov_result(result,resolve,reject);
                },reject);
                return;


    }

    function parse_generic_inner(doc,the_table,typeTitle) {
        var found_email=false;
        console.log("in parse_generic inner,length="+typeTitle.length);
        var i,j,x;
        try {
            var begin_row_index=-1,end_row_index=the_table.rows.length;
            console.log("Got right sport "+begin_row_index+"\t"+the_table.rows.length);
            for(i=0; i < typeTitle.length; i++) {
                console.log("typeTitle["+i+"]="+typeTitle[i].innerText);
                if(is_right_sport(typeTitle[i].innerText.toLowerCase().trim())) {
                    begin_row_index=typeTitle[i].parentNode.rowIndex+1;
                    if(i < typeTitle.length-1) end_row_index=typeTitle[i+1].parentNode.rowIndex;
                    break;
                }
            }
            console.log("begin_row_index="+begin_row_index+", end_row_index="+end_row_index);
            //console.log(the_table.length);
            if(begin_row_index===-1) {
                console.log("Could not find right sport");
                return false;
            }
            console.log("Got right sport "+begin_row_index+"\t"+the_table.rows.length);
            var title_map={0: "name", 1:"title",2:"email",3:"phone"},curr_ret={name:"",title:"",email:"",phone:""};
            var curr_text,curr_row,new_cell,ctr=1,email_col=-1,curr_elem;
            if(begin_row_index<end_row_index) {
                for(j=0; j < the_table.rows[begin_row_index].cells.length; j++)
                {
                    curr_text=the_table.rows[begin_row_index].cells[j].innerText.trim();
                    if(/(^|\s)Coach|Director(\s|$)/.test(curr_text) &&
                       title_map[j]==="name")
                    {
                        title_map[j]="title";
                        title_map[1]="name";
                    }
                    if(phone_re.test(curr_text) && title_map[j]==="email")
                    {
                        title_map[j]="phone";
                        title_map[3]="email";
                    }
                    if((curr_elem=the_table.rows[begin_row_index].cells[j]).getElementsByTagName("a").length>0 &&
                      curr_elem.getElementsByTagName("a")[0].href.match(email_re))
                    {
                        console.log("found email_col="+j);
                        email_col=j;
                    }

                }
                if(the_table.rows[begin_row_index].cells.length===3 && email_col!==-1)
                {
                    for(i=begin_row_index; i < end_row_index; i++)
                    {
                        curr_ret={};
                        //console.log("the_table.rows["+i+"]="+the_table.rows[i].innerText);
                        curr_row=the_table.rows[i];
                        curr_elem=the_table.rows[begin_row_index].cells[email_col];


                        new_cell=doc.createElement("td");
                        new_cell.innerHTML="";
                        console.log("curr_elem.innerText="+curr_elem.innerText+", email_col="+email_col+", curr_row.length="+curr_row.cells.length);
                        if(curr_elem.getElementsByTagName("a").length>0)
                        {
                            new_cell.innerHTML=the_table.rows[begin_row_index].cells[email_col].getElementsByTagName("a")[0].href.match(email_re)[0];
                        }
                        curr_row.insertCell(new_cell);
                        console.log("curr_row.innerText="+curr_row.innerText);

                    }
                }
                else
                {
                    console.log("F:the_table.rows[begin_row_index].cells.length="+the_table.rows[begin_row_index].cells.length);
                }
            }
            console.log("title_map="+JSON.stringify(title_map));
            for(i=begin_row_index; i < end_row_index; i++) {
                curr_ret={};
                console.log("ddfthe_table.rows["+i+"]="+the_table.rows[i].innerText);
                for(j=0; j < the_table.rows[i].cells.length; j++)
                {
                    //console.log("the_table.rows["+i+"].cells["+j+"].innerText="+the_table.rows[i].cells[j].innerText);
                    if(title_map[j]!==undefined)
                    {
                        if(the_table.rows[i].cells[j].getElementsByTagName("a").length>0 && /^mailto:\s*/.test(the_table.rows[i].cells[j].getElementsByTagName("a")[0].href))
                        {
                            curr_ret[title_map[j]]=the_table.rows[i].cells[j].getElementsByTagName("a")[0].href.replace(/^mailto:\s*/,"");
                        }
                        else
                        {
                            curr_ret[title_map[j]]=the_table.rows[i].cells[j].innerText.trim();
                        }
                    }
                }
                if((!curr_ret.name||curr_ret.name.length<2) && the_table.rows[i].cells.length>0) curr_ret.name=the_table.rows[i].cells[0].innerText.trim();
                console.log("curr_ret="+JSON.stringify(curr_ret));
                if(curr_ret.name&&curr_ret.name.length>0) {
                    if(curr_ret.email&&curr_ret.email.length>0 && curr_ret.email.match(email_re)) { console.log("ctr="+ctr+"curr_ret.email="+curr_ret.email); found_email=true; }
                    add_fields(curr_ret,ctr);
                    ctr++;
                }
            }
            if(!my_query.submitted && ctr>1 && found_email)
            {
                submit_if_done();
                return true;
            }
        }
        catch(error) { console.log("Failed generic "+error); return false; }
        return false;
    }
    /* Guess title_map from first row format */
    function guess_title_map(curr_row)
    {
        var title_map={},i,j,curr_text,curr_split,found_title=false,inner_a;
        console.log("*** guess_title_map curr_row.innerText="+curr_row.innerText);
        for(j=0; j < curr_row.cells.length; j++)
        {
            curr_text=curr_row.cells[j].innerText.trim();
            console.log("j="+j+", curr_text="+curr_text);
            if(j===0)
            {
                curr_split=curr_text.split(/[\s-,\n]+/);
                if(curr_split.length>=1)
                {
                    title_map[j]="name";
                }

            }
            else if(curr_text.match(phone_re)) title_map[j]="phone";
            else if(curr_text.match(email_re) || /contact/.test(curr_text) ||
                    ((inner_a=curr_row.cells[j].getElementsByTagName("a")).length>0 &&
                     /mailto:/.test(inner_a[0].href))
                   ) title_map[j]="email";
            else if(!found_title || /position|title/i.test(curr_text)) {
                title_map[j]="title";

                found_title=true;
            }
            else { console.log("found_title="+found_title); }

        }
        return title_map;
    }
    function parse_generic2(the_table) {
        console.log("In parse_generic2");
        var i,j,x;
        var title_map={},title_map_inv={},begin_index=1;
        if(the_table.rows.length<2) return;
        var curr_row=the_table.rows[0], curr_text;
       try
       {
            for(j=0; j < curr_row.cells.length; j++)
            {
                curr_text=curr_row.cells[j].innerText;
                if(/(name)|(coach)/i.test(curr_text)) { title_map[j]="name"; title_map_inv.name=j; }
                else if(/mail/i.test(curr_text)) { title_map[j]="email"; title_map_inv.email=j; }
                else if(/phone/i.test(curr_text)) { title_map[j]="phone"; title_map_inv.phone=j; }
                else if(/(sport)|(title)|(position)/i.test(curr_text)) { title_map[j]="title"; title_map_inv.title=j; }

            }
           if(!title_map.name||!title_map.title||!title_map.phone||!title_map.email)
           {
               begin_index=0;
               title_map=guess_title_map(curr_row);
               for(x in title_map)
               {
                   title_map_inv[title_map[x]]=x;
               }
               if(!title_map_inv["title"]) title_map_inv["title"]="0";
           }
           if(!title_map_inv.name) {
               console.log("No name found in "+JSON.stringify(title_map_inv));
               return false; }
            console.log("title_map="+JSON.stringify(title_map)+"\ntitle_map_inv="+JSON.stringify(title_map_inv));
            var curr_ret={name:"",title:"",email:"",phone:""},curr_split;
            var ctr=1,curr_title;
            for(i=begin_index; i < the_table.rows.length; i++)
            {
                curr_ret={name:"",title:"",email:"",phone:""};
                if(title_map_inv.title===title_map_inv.name && the_table.rows[i].cells.length>0)
                {
                    curr_text=the_table.rows[i].cells[0].innerText.trim();
                    curr_split=curr_text.split(/[\n-,]+\s/);
                    curr_ret.name=curr_split[0].trim();
                    if(curr_split.length>1) curr_ret.title=curr_split[1].trim();
                    console.log("title=name");

                }
                console.log("curr_ret="+JSON.stringify(curr_ret));


                //console.log("i="+i);
                if(the_table.rows[i].cells.length> title_map_inv.title)
                {
                    console.log("title="+the_table.rows[i].cells[title_map_inv.title].innerText);
                }
                if(the_table.rows[i].cells.length<= title_map_inv.title ||
                   (!is_right_sport(curr_ret.title)
                   &&
                    curr_ret.title.indexOf(
                    my_query.sport.toLowerCase())===-1 &&
                    curr_ret.title.indexOf(
                    my_query.short_sport.toLowerCase())===-1
                   )

                  ) continue;
                for(j=1; j < the_table.rows[i].cells.length; j++)
                {
                    //console.log("(i,j)="+i+","+j);

                    console.log("the_table.rows["+i+"].cells["+j+"].innerText="+the_table.rows[i].cells[j].innerText);
                    if(title_map[j]!==undefined )
                    {
                        if(the_table.rows[i].cells[j].getElementsByTagName("a").length>0 && /^mailto:\s*/.test(the_table.rows[i].cells[j].getElementsByTagName("a")[0].href))
                        {

                            curr_ret[title_map[j]]=the_table.rows[i].cells[j].getElementsByTagName("a")[0].href.replace(/^mailto:\s*/,"");
                        }
                        else
                        {
                            curr_ret[title_map[j]]=the_table.rows[i].cells[j].innerText;
                        }
                    }
                }
                if(curr_ret.name.length<2 && the_table.rows[i].cells.length>0) curr_ret.name=the_table.rows[i].cells[0].innerText;
                console.log("curr_ret="+JSON.stringify(curr_ret));
                add_fields(curr_ret,ctr);
                ctr++;

            }
            if(!my_query.submitted)
            {
                submit_if_done();
                return true;
            }

        }
       catch(error) { console.log("Failed generic2 "+error); return false; }

        return false;

    }
    /* parse_generic3 is the correct generic table parse */
    function parse_generic3(doc,url,resolve,reject,the_table,begin_row,end_row) {
        console.log("In parse_generic3,url="+url);
        var i,j,x,k;
        var title_map={},title_map_inv={};
        if(begin_row===undefined) begin_row=1;
        if(end_row===undefined) end_row=the_table.rows.length;
        if(the_table.rows.length<2) return;
        var curr_row=the_table.rows[begin_row-1], curr_text,phone_prefix;
        try {
            for(j=0; j < curr_row.cells.length; j++)
            {
                curr_text=curr_row.cells[j].innerText;
                if(/(name)|(coach)/i.test(curr_text)) { title_map[j]="name"; title_map_inv.name=j; }
                else if(/mail|contact/i.test(curr_text)) { title_map[j]="email"; title_map_inv.email=j; }
                else if(/phone/i.test(curr_text)) {
                    title_map[j]="phone";
                    title_map_inv.phone=j;
                    if(phone_prefix=curr_text.match(/\([\d]+\)/)) my_query.phonePrefix=phone_prefix[0]+" ";
                    console.log("phone_prefix="+phone_prefix);
                }
                else if(/(sport)|(title)|(position)/i.test(curr_text)) { title_map[j]="title"; title_map_inv.title=j; }

            }
            console.log("title_map_inv="+JSON.stringify(title_map));
            var curr_ret={name:"",title:"",email:"",phone:""};

            var ctr=1,the_span;
            for(i=begin_row; i < end_row; i++)
            {
                curr_ret={name:"",title:"",email:"",phone:""};
                if(the_table.rows[i].cells.length>= title_map_inv.title)
                {
                    console.log("title="+the_table.rows[i].cells[title_map_inv.title].innerText);
                }
                /*if(the_table.rows[i].cells.length<= title_map_inv.title ||
                   (!is_right_sport(the_table.rows[i].cells[title_map_inv.title].innerText))) continue;*/
                for(j=0; j < the_table.rows[i].cells.length; j++)
                {

                    console.log("the_table.rows["+i+"].cells["+j+"].innerText="+the_table.rows[i].cells[j].innerText);
                    if(title_map[j]!==undefined)
                    {
                        if(the_table.rows[i].cells[j].getElementsByTagName("a").length>0 &&
                           /^mailto:\s*/.test(the_table.rows[i].cells[j].getElementsByTagName("a")[0].href))
                        {

                            curr_ret[title_map[j]]=the_table.rows[i].cells[j].getElementsByTagName("a")[0].href.replace(/^mailto:\s*/,"").trim();
                        }
                        else
                        {
                            the_span=the_table.rows[i].cells[j].getElementsByTagName("span");
                            curr_ret[title_map[j]]=the_table.rows[i].cells[j].innerText.replace(/\n/g," ").trim();
                            for(k=0;k<the_span.length; k++)
                            {
                                curr_ret[title_map[j]]=curr_ret[title_map[j]].replace(the_span[k].innerText,"").trim();
                            }
                        }
                    }
                }
                if(curr_ret.name.length<2 && the_table.rows[i].cells.length>0) curr_ret.name=the_table.rows[i].cells[0].innerText;
                console.log("curr_ret="+JSON.stringify(curr_ret));
                if(/^Name/.test(curr_ret.name)) return false;
                add_fields(curr_ret,ctr);
                ctr++;

            }
            if(ctr>1) {
                resolve("success in parse_generic3");
                return;
            }

        }
        catch(error) { console.log("Failed generic3 "+error); reject("Failed generic3 "+error); }
        return false;
    }
    /* Still not parsing apparently??? */
    function parse_scrollHead(doc,url,resolve,reject) {
        console.log("in parse_scrollHead");
        var i,ret={},tab1,tab2;
        var scrollHead=doc.getElementsByClassName("dataTables_scrollHead");
        for(i=0; i < scrollHead.length; i++)
        {
            if((tab1=scrollHead.getElementsByTagName("table")).length===0) continue;

        }
        return false;

    }

    function parse_hometeamsonline(doc,url,resolve,reject) {
        var item=doc.getElementsByClassName("modGroupItem"),i;
        var ret={},ctr=1,field,spans,curr_span,j;
        if(item.length===0) return false;
        for(i=0; i < item.length; i++)
        {
            ret={};
            if((field=item[i].getElementsByTagName("a")).length>0) ret.name=field[0].innerText;
            spans=item[i].getElementsByTagName("span");
            for(j=0; j < spans.length; j++)
            {
                curr_span=spans[j].innerText.trim();
                if(email_re.test(curr_span) || /@/.test(curr_span)) ret.email=curr_span;
                else if(phone_re.test(curr_span)) ret.phone=curr_span;
                else if(ret.title===undefined) ret.title=curr_span;
            }
            if(ret.name!==undefined)
            {
                add_fields(ret,ctr);
                ctr++;
            }
        }
        resolve("success parse_hometeamsonline");
        return true;
    }

    function parse_staff_department(doc) {
        var dept=doc.getElementsByClassName("staff-department"),i,j;
        var curr_ret,sec_title,items,ctr=1,name,position,email,phone,email_span;
        for(i=0; i < dept.length; i++)
        {
            if((sec_title=dept[i].getElementsByClassName("section-title")).length>0 &&
               is_right_sport(sec_title[0].innerText.trim()))
            {
                items=doc.getElementsByClassName("list-group-item");
                for(j=0; j < items.length; j++)
                {
                    curr_ret={};
                    if((name=items[j].getElementsByClassName("name")).length>0) curr_ret.name=name[0].innerText.trim();
                    if((position=items[j].getElementsByClassName("position")).length>0 ||
                      (position=items[j].getElementsByClassName("title")).length>0) curr_ret.title=position[0].innerText.trim();
                    if((phone=items[j].getElementsByClassName("phone")).length>0) curr_ret.phone=phone[0].innerText.trim();
                    if((email=items[j].getElementsByClassName("email")).length>0 &&
                      (email_span=email[0].getElementsByClassName("__cf_email__")).length>0)
                    {
                       curr_ret.email=decryptCloudFlare(email_span[0].dataset.cfemail);
                    }
                    if(curr_ret.name!==undefined) {
                        add_fields(curr_ret,ctr);
                        ctr++;
                    }

                }
                break;
            }
        }
        if(!my_query.submitted)
        {
            submit_if_done();
            return true;
        }
    }

    function parse_staff_directory(doc,url,resolve,reject,containerName,queryName) {
        console.log("In parse_staff_directory "+containerName+",queryName="+queryName);
        if(containerName===undefined) containerName=".staff-directory";
        if(queryName===undefined) queryName="h2";

        var i,directory=doc.querySelectorAll(containerName),h2,the_table;
        console.log("directory.length="+directory.length);
        for(i=0; i < directory.length; i++)
        {
            if((h2=directory[i].querySelectorAll(queryName)).length>0 && is_right_sport(h2[0].innerText) &&
              (the_table=directory[i].getElementsByTagName("table")).length>0)
            {
                console.log("Found sport "+h2[0].innerText+", the_table ");
                if(containerName===".staff-directory") return parse_generic3(doc,url,resolve,reject,the_table[0]);
                else {
                    reject("failed parse_staff_directory");
                    return false;
                }
            }
            else { console.log("("+i+"), h2.length="+h2.length); }
        }
        var staff_member=doc.getElementsByClassName("staff-member");
        if(staff_member.length>0) return parse_staff_member(doc,url,resolve,reject,staff_member);
        reject("Failed parse_staff_directory at the bottom");
        return false;
    }

    function parse_staff_member(doc,url,resolve,reject,member)
    {
        var i,ctr=1;
        var sport_regex=new RegExp(my_query.sport,"i"),ret;
        for(i=0; i < member.length; i++)
        {
            if(sport_regex.test(member[i].innerText)){
                ret=Gov.parse_data_func(member[i].innerText);
                add_fields(ret,ctr);
                ctr++;
            }
        }

        if(ctr>1)
        {
            resolve("success parse_staff_member");
            return;
        }
        reject("FAiled, no staff members in parse_staff_member");
        return false;
    }

    function parse_view_coaches(doc,url,resolve,reject)
    {
        var i,j,coaches=doc.getElementsByClassName("view-coaches");
        if(coaches.length===0) coaches=doc.getElementsByClassName("view-contact-persons");
        if(coaches.length===0) { console.log("Failed to find inner coaches"); return false; }

        var rows=coaches[0].getElementsByClassName("views-row");
        console.log("At rows, "+rows.length);
        var ret={},ctr=1,name,email,title,phone;
        for(i=0; i < rows.length;i++)
        {
            ret={};
            if((name=rows[i].getElementsByClassName("views-field-title")).length>0
              || (name=rows[i].getElementsByClassName("views-field-title-1")).length>0
              ) ret.name=name[0].innerText.trim();
            if((title=rows[i].getElementsByClassName("views-field-field-position-title")).length>0 ||
              (title=rows[i].getElementsByClassName("views-field-field-person-title")).length>0
              ) ret.title=title[0].innerText.trim();
            if(((email=rows[i].getElementsByClassName("views-field-field-coach-email")).length>0 ||
               (email=rows[i].getElementsByClassName("views-field-field-person-email")).length>0
               )&&
              email[0].getElementsByTagName("a").length>0)
            {
                ret.email=email[0].getElementsByTagName("a")[0].href.replace(/^\s*mailto:\s*/,"");
            }
            if(((phone=rows[i].getElementsByClassName("views-field-field-coach-phone")).length>0 ||
               (phone=rows[i].getElementsByClassName("views-field-field-person-phone")).length>0
               )&&
              phone[0].innerText.match(phone_re))
            {
                ret.phone=phone[0].innerText.match(phone_re)[0];
            }
            if(ret.name) {
                add_fields(ret,ctr);
                ctr++;
            }
        }
        resolve("success parse_view_coaches");
        return true;
    }

    function parse_staff_bio_wrapper(doc,url,resolve,reject) {
        console.log("in staffbiowrapper");
        var staffBio=doc.getElementsByClassName("staffBioWrapper"),i,j;
        var ret={},name,email,sport,title,desc;
        var ctr=1;
        for(i=0; i < staffBio.length; i++)
        {
            ret={};
            name=staffBio[i].getElementsByClassName("staffBioName")[0].innerText;
            if((sport=name.match(/^[^-]+/)) && is_right_sport(sport[0].trim()))
            {
                console.log("Found sport!");
                if(title=name.match(/-([^:]+)/)) ret.title=title[1].trim();
                if(/:/.test(name)) ret.name=name.match(/:(.*)$/)[1].trim();
                if((desc=staffBio[i].getElementsByClassName("staffBioDescription")).length>0 &&
                   (email=desc[0].innerText.match(email_re))) ret.email=email[0];
            }
            if(ret.name!==undefined)
            {
                add_fields(ret,ctr);
                ctr++;
            }
        }
        resolve("success parse_staff_bio_wrapper");
        return true;
    }


    function parse_coachbios(doc,url,resolve,reject)
    {
        var ctr=1;
        var title_map={0: "name", 1:"title",2:"email",3:"phone"};
        var curr_ret={name:"",title:"",email:"",phone:""};
        var bios=doc.getElementsByClassName("coach-bio"),i,j,info,inner_p;
        for(i=0; i < bios.length; i++)
        {
            curr_ret={};
            if(ctr>10) break;
            if((info=bios[i].getElementsByClassName("info")).length>0)
            {
                var p=info[0].getElementsByTagName("p");
                for(j=0; j < p.length; j++) curr_ret[title_map[j]]=p[j].innerText.trim();
                
                add_fields(curr_ret,ctr);
                ctr++;
            }
        }
        resolve("sucess parse_coachbios");
        return true;
    }

    function parse_staffdir(doc,url,resolve,reject) {
        var staffdir=doc.getElementById("staffdir");
        if(staffdir===null ||staffdir.tagName!=="TABLE") {
            reject("failed parse_staffdir");
            return true;
        }
        var the_table=staffdir;
        var i,j, x;

        var typeTitle=the_table.getElementsByTagName("th");
        var begin_row_index=-1;
        var end_row_index=the_table.rows.length;
        for(i=0; i < typeTitle.length; i++)
        {
            console.log("typeTitle["+i+"]="+typeTitle[i].innerText);
            if(is_right_sport(typeTitle[i].innerText.toLowerCase()))
            {
                begin_row_index=typeTitle[i].parentNode.rowIndex+1;
                if(i < typeTitle.length-1) end_row_index=typeTitle[i+1].parentNode.rowIndex;
                break;
            }
        }
        //console.log(the_table.length);
        //if(end_row_index===undefined) end_row_index=the_table.length;
        if(begin_row_index===-1) {
            console.log("Could not find right sport");
            return;
        }
        console.log("Got right sport "+begin_row_index+"\t"+end_row_index);
        var title_map={0: "name", 1:"title",2:"email",3:"phone"};

        var curr_ret={name:"",title:"",email:"",phone:""};
        var curr_text;
        var ctr=1;
        for(i=begin_row_index; i < end_row_index; i++)
        {
            curr_ret={};
            for(j=0; j < the_table.rows[i].cells.length; j++)
            {
                console.log("the_table.rows["+i+"].cells["+j+"].innerText="+the_table.rows[i].cells[j].innerText);
                if(title_map[j]!==undefined)
                {
                    if(the_table.rows[i].cells[j].getElementsByTagName("a").length>0 && /^mailto:\s*/.test(the_table.rows[i].cells[j].getElementsByTagName("a")[0].href))
                    {
                        curr_ret[title_map[j]]=the_table.rows[i].cells[j].getElementsByTagName("a")[0].href.replace(/^mailto:\s*/,"");
                    }
                    else
                    {
                        curr_ret[title_map[j]]=the_table.rows[i].cells[j].innerText;
                    }
                }
            }
            console.log("curr_ret="+JSON.stringify(curr_ret));
            add_fields(curr_ret,ctr);
            ctr++;

        }
        resolve("");
        return true;
    }
    function parse_dbml2(doc,url,resolve,reject) {
        console.log("in parse_dbml2,url="+url);
        var i,j,k,the_tab=doc.getElementsByTagName("table"),sport_name,begin_row_index=0,end_row_index=0;
        if(the_tab.length===0) return false;
        sport_name=the_tab[0].getElementsByClassName("sport-name");
        for(i=0; i < sport_name.length; i++) {
            if(sport_name[i].tagName==="TR" && sport_name[i].cells.length>0 && is_right_sport(sport_name[i].cells[0].innerText)) {
                if(the_tab[0].querySelector(".coach-name")) {
                    return parse_dbml_coachname(doc,url,resolve,reject,the_tab[0],sport_name[i].rowIndex+1,
                                                  i+1<sport_name.length ? sport_name[i+1].rowIndex : the_tab[0].rows.length);
                }

                return parse_info_directory_table(doc,url,resolve,reject,the_tab[0],sport_name[i].rowIndex+1,
                                                  i+1<sport_name.length ? sport_name[i+1].rowIndex : the_tab[0].rows.length);
            }
        }
        reject("Failed at parsing dbml");

    }
    function parse_dbml_coachname(doc,url,resolve,reject,the_table,begin_row,end_row,title_map) {
        var i,j, x,header;
        var ct=1;
        console.log("parse_info_directory_table,begin_row="+begin_row+",end_row="+end_row+",title_map="+title_map);
        if(begin_row===undefined) begin_row=0;
        if(end_row===undefined) end_row=the_table.rows.length;
        header=the_table.rows[begin_row];
        if(header===undefined || header===null) console.log("Error with roster-header");
        if(!title_map) title_map=assign_title_map(header);
        var my_title_map={".coach-name":"name",".coach-position":"title",".coach-phone":"phone",".coach-email":"email"};
        var curr_ret={},curr_text,ctr=1,curr_elem;
        for(i=begin_row+1; i < end_row; i++) {
            curr_ret={};
            print_table_row(the_table.rows[i],i);
            for(x in my_title_map) {
                curr_elem=the_table.rows[i].querySelector(x);
                console.log("x="+x+", curr_elem="+curr_elem);
                if(!curr_elem) continue;
                if(my_title_map[x]==='email' && curr_elem.tagName==="A") curr_ret.email=curr_elem.href.replace(/^\s*mailto:\s*/,"");
                else curr_ret[my_title_map[x]]=curr_elem.innerText.trim();
            }
            console.log("curr_ret="+JSON.stringify(curr_ret));
            add_fields(curr_ret,ct++);
            if(ct>10) break;
        }
        resolve("");
        return true;
    }

    function parse_dbml(doc,url,resolve,reject)
    {
        console.log("in parse_dbml");
        var i,j,k,the_tab=doc.getElementsByTagName("table");
        for(i=0; i < the_tab.length; i++) {
            if(the_tab[i].rows.length>0 && /Name/i.test(the_tab[i].rows[0].innerText)) break;
        }

        if(i>=the_tab.length) return parse_dbml2(doc,url,resolve,reject);
        the_tab=the_tab[0];
        var ctr=1;
        var text,ret;
        console.log("Doing table");
        for(i=0; i < the_tab.rows.length; i++)
        {
            console.log("the_tab.rows[i].cells[0].colspan="+the_tab.rows[i].cells[0].getAttribute("colspan"));
            if(the_tab.rows[i].cells.length>0 && the_tab.rows[i].cells[0].getAttribute("colspan")!==null &&
               parseInt(the_tab.rows[i].cells[0].getAttribute("colspan"))>=4 &&
               is_right_sport(the_tab.rows[i].cells[0].innerText)
              )
            {
                for(j=i+1; j < the_tab.rows.length; j++)
                {
                    console.log("parsing ("+j+")="+the_tab.rows[j].innerText);
                    if(the_tab.rows[j].cells.length>0 && the_tab.rows[j].cells[0].getAttribute("colspan")!==null &&
                       the_tab.rows[j].cells[0].getAttribute("colspan")==="4") break;
                    text="";
                    for(k=0; k < the_tab.rows[j].cells.length; k++)
                    {
                        text=text+the_tab.rows[j].cells[k].innerText+"\t";
                    }
                    console.log("text="+text);
                    ret=Gov.parse_data_func(text);
                    add_fields(ret,ctr);
                    ctr++;
                }
                resolve("Success in parse_dbml");
                return true;
            }
        }
    }

    function parse_athletics_staff(doc,url,resolve,reject) {
        console.log("In parse_athletics_staff,url="+url);
        var category=doc.getElementsByClassName("category");
        var staffdir;
        if(category.length===0) { console.log("Bad category"); return false; }
        staffdir=category[0].parentNode;
        var i,j,k;
        var children=staffdir.children;
        var title_vars=["name","title","phone","email"];
        var ctr=1;
        var curr_ret={};
        for(i=0; i < children.length; i++)
        {
            if(children[i].className.indexOf("category")!==-1 && is_right_sport(children[i].innerText))
            {
                for(j=i+1; j < children.length && children[j].className.indexOf("category")===-1; j++)
                {
                    console.log(children[j].outerHTML);
                    curr_ret={};
                    for(k=0; k < title_vars.length; k++)
                    {
                        if(children[j].getElementsByClassName(title_vars[k]).length>0)
                        {
                            if(title_vars[k]==="email" && children[j].getElementsByClassName(title_vars[k])[0].getElementsByTagName("a").length>0)
                            {
                                let the_a=children[j].getElementsByClassName(title_vars[k])[0].getElementsByTagName("a")[0];
                                if(email_re.test(the_a.href.replace(/^mailto:\s*/,""))) {
                                    curr_ret[title_vars[k]]=the_a.href.replace(/^mailto:\s*/,"").match(email_re)[0];
                                }
                                else curr_ret[title_vars[k]]=children[j].getElementsByClassName(title_vars[k])[0].innerText.trim();
                            }
                            else curr_ret[title_vars[k]]=children[j].getElementsByClassName(title_vars[k])[0].innerText.trim();
                        }
                        else
                        {
                            console.log("title_vars["+k+"]="+title_vars[k]+", not found");
                        }

                    }
                    add_fields(curr_ret,ctr);
                    ctr++;
                }

            }
        }
        resolve("success in parse_athletics_staff");
        return true;
    }
    function parse_sports_index(doc,url,resolve,reject) {
        console.log("Beginning parse_sports_indexy,url="+url);
        my_query.fields.coachsite=url;
        my_query.fields.teamsite=url.replace(/\/coaches\//,"/");
        var info=doc.querySelectorAll("#mainbody .info");
        var i,j,ctr=1,k,mainbody;
        var ret,roster,the_table;
        for(i=0; i < info.length && ctr<=10; i++) {
            let temp_ret=Gov.parse_data_func(info[i].innerText);
            console.log("innerText="+info[i].innerText+", temp_ret="+JSON.stringify(temp_ret));
            add_fields(temp_ret,ctr);
            ctr++;
        }
        if(info.length>0) {
            resolve("success parse_sports_index");
            return true;
        }
        else if(info.length===0 && (mainbody=doc.getElementById("mainbody"))) {

            if(url.indexOf("/coaches/")!==-1 && doc.getElementsByClassName("player-info").length>0) return parse_sports_index_coach(doc,url,resolve,reject);
            console.log("Found mainbody");
            if((roster=doc.getElementsByClassName("roster")).length>0 &&
               roster[0].getElementsByTagName("table").length>0) return parse_generic3(doc,url,resolve,reject,roster[0].getElementsByTagName("table")[0]);
            if((the_table=mainbody.getElementsByTagName("table")).length>0) the_table=the_table[0];
            else {
                reject("failed on the_table in mainbody");
                return false;
            }
            console.log("the_table="+the_table.rows.length);
            for(i=0; i < the_table.rows.length; i++)
            {

                for(j=0; j < the_table.rows[i].cells.length; j++)
                {
                    console.log("("+i+","+j+": "+the_table.rows[i].cells[j].innerText);
                    var text=the_table.rows[i].cells[j].innerText;
                    var style_text=the_table.rows[i].cells[j].getElementsByTagName("style");
                    for(k=0; k < style_text.length; k++)
                    {
                        text=text.replace(style_text[k].innerText,"").trim();
                    }

                    ret=Gov.parse_data_func(text);
                    add_fields(ret,ctr);
                    ctr++;
                }
            }
            submit_if_done();
            return true;
        }
        else if(info.length===0 && !my_query.submitted) {
            console.log("Did not find mainbody, returning "+MTurk.assignment_id);
            GM_setValue("returnHit"+MTurk.assignment_id,true);
        }


    }

    function parse_sports_index_coach(doc,url,resolve,reject) {
        console.log("Beginning parse_sports_index_coach,url="+url);
        var i,j,x;
        var player_info=doc.getElementsByClassName("player-info");
        var ret,tab;
        var field_names={"Title: ": "title", "Phone: ":"phone","Email: ":"email"};
        var ctr=1;
        for(i=0; i < player_info.length; i++) {
            ret={name:"",title:"",phone:"",email:""};
            ret.name=player_info[i].getElementsByClassName("name")[0].innerText.trim();
            tab=player_info[i].getElementsByTagName("table");
            if(tab.length>0) {
                for(j=0; j < tab[0].rows.length; j++) {
                    let curr_row=tab[0].rows[j].innerText;
                    for(x in field_names) {
                        if(curr_row.indexOf(x)!==-1) ret[field_names[x]]=curr_row.replace(x,"").trim();
                    }
                }
            }
            add_fields(ret,ctr);
            ctr++;
        }
        resolve("Success parse_sports_index_coach");
        return true;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        my_query.try_count=0;
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow, b_caption,lgb_info,b_context,parsed_lgb,parsed_context;
        var b1_success=false, b_header_search,found_address=false;
        var curr_best_url="";
        try {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
             lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(!my_query.fields.phone && parsed_context.Phone) my_query.fields.phone=parsed_context.Phone;
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < 4 && i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href
                    .replace("m.facebook.com/","www.facebook.com/").replace(/(https?:\/\/[^\/]*\/[^\/]+)\/posts.*$/,"$1")
                    .replace(/(https?:\/\/[^\/]*\/[^\/]+)\/about.*$/,"$1").replace(/(https?:\/\/[^\/]*\/[^\/]+)\/reviews.*$/,"$1");
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                b_factrow=b_algo[i].querySelector(".b_factrow");
                if(b_caption.length>0) b_caption=b_caption[0].innerText;
                else b_caption="";
                if(/^address$/.test(type) && b_factrow) found_address=found_address||parse_b_factrow(b_factrow);
                console.log("i="+i+", b_url="+b_url+", b_name="+b_name);
                if(/^query$/.test(type) && !MTP.is_bad_url(b_url,bad_urls,-1) &&
                   b_url.replace(/\/$/,"")!==my_query.school_url.replace(/\/$/,"")) {
                    console.log("Found something b_url="+b_url+",my_query.school_url="+my_query.school_url);
                    if(!MTP.is_bad_url(b_url,bad_urls,4,2)) {
                        b1_success=true;
                        break;
                    }
                    else if(!curr_best_url) curr_best_url=b_url;
                }
            }
            if(!b1_success && curr_best_url) b_url=curr_best_url;
            if(b1_success) {
                resolve(b_url);
                return;
            }


        }
        catch(error) {
            console.log("Error "+error);
            reject(error);
            return; }
        let parsed_add1;
        if(/^address$/.test(type)&&parsed_context&&parsed_context.Address&&
          (parsed_add1=new Address(parsed_context.Address,1000))) {
            Address.addressList.push(parsed_add1);
            found_address=true; }


        if(/^address$/.test(type)&&found_address) {
            resolve("");
            return;
        }
        else if(/^address$/.test(type) && my_query.try_count_lst.address===0) {
            my_query.try_count_lst[type]++;
            let search_str=MTP.get_domain_only(my_query.last_good_url,true)+"  address";
            query_search(search_str,resolve,reject,query_response,type);
            return;
        }
        else if(/^address$/.test(type) && my_query.try_count_lst.address===1) {
            my_query.try_count_lst[type]++;
            let search_str=my_query.name+" physical address";
            query_search(search_str,resolve,reject,query_response,type);
            return;
        }
         else if(/^address$/.test(type) && my_query.try_count_lst.address===2) {
            my_query.try_count_lst[type]++;
            let search_str=my_query.name+" "+MTP.get_domain_only(my_query.school_url)+" physical address";
            query_search(search_str,resolve,reject,query_response,type);
            return;
        }
        console.log("Nothing found");
        if(/^address$/.test(type)) {
            reject("");
            return;
        }
        GM_setValue("returnHit"+MTurk.assignment_id,true);
        return;
    }
    function parse_b_factrow(b_factrow) {
        var li=b_factrow.querySelectorAll("li");
        var loc_re=/^\s*Location:\s*(.*)$/,match,parsed_add;
        var is_good=false;
        let b_address=b_factrow.querySelector(".b_address");
        if(b_address&&((parsed_add=new Address(b_address.innerText.trim())))) {
            console.log("Found good b_address="+JSON.stringify(parsed_add));
            Address.addressList.push(parsed_add);
            is_good=true;
            return is_good;
        }
        else if(b_address) {
            console.log("Found bad b_address="+b_address.innerText.trim()); }


        li.forEach(function(elem) {
            if((match=elem.innerText.trim().match(loc_re))) {
                console.log("b_factrow match="+match);
                match[1]=match[1].replace(/([\d\-]{5,10}),\s*([^,]*)$/,"$2,$1");
                if((parsed_add=new Address(match[1],1))) {
                    console.log("parsed_add="+JSON.stringify(parsed_add));
                    Address.addressList.push(parsed_add);
                    is_good=true;
                }
            }
        });
        return is_good;
    }
    function query_promise_then(url) {
        if(my_query.doneNewUrl) {
            console.log("Already tried new ");
            fill_no_baseball_btn();
            submit_if_done();

                                 /*GM_setValue("returnHit"+MTurk.assignment_id,true); */

                                 return; }
        my_query.doneNewUrl=true;
        my_query.url=url;
        console.log("New query url="+my_query.url);
        const sportsPromise = new Promise((resolve, reject) => {
            console.log("Beginning dist search");
           sports_search(resolve, reject); })
        .then(sports_promise_then).catch(function(val) { console.log("Failed dist " + val);
                                                                                                                 GM_setValue("returnHit"+MTurk.assignment_id,true);

                                                       });
    }
    function parse_staff_dgrd(doc,url,resolve,reject,the_table,prefix,the_script) {
        console.log("in parse_staff_dgrd,url="+url);
        var i,j,k,x,script_array=[],split_script,new_elem,the_match,curr_row, curr_cell;
        var script_regex=/\(\'([^,]+)\',([^\),]+),([^\),]+),\s*([\d]+),\s*([\d]+),\s*([^\),]+)\);/;
        my_query.fields.coachsite=url;
        my_query.fields.teamsite=url.replace(/\/[^\.]*\.aspx/,"/index.aspx");
        let copyrights=doc.querySelectorAll(".copyright_info div,#footer div"),parsed_add;
        for(x of copyrights) {
            parsed_add=new Address(x.innerText.trim());
            if(parsed_add&&parsed_add.city) add_address(parsed_add);
        }
        if(prefix==="coaches") return parse_info_directory_table(doc,url,resolve,reject,the_table);
        split_script=the_script.innerHTML.split("\n");
        console.log("the_script.innerHTML="+the_script.innerHTML);
        for(i=0; i < split_script.length; i++) {
            if(the_match=split_script[i].match(script_regex)) {
                new_elem={text: the_match[1].replace("\\\'","\'"), className: the_match[3].replace("'","").replace("'",""), index: the_match[4], colspan: the_match[5]};
                script_array.push(new_elem);
                console.log("new_elem="+JSON.stringify(new_elem));
            }
        }
        for(i=0; i < script_array.length; i++) {
            //console.log("script_array[i].index+1="+(parseInt(script_array[i].index)+1));
            curr_row=the_table.insertRow(parseInt(script_array[i].index)+1);
            curr_cell=curr_row.insertCell(0);
            curr_cell.setAttribute('colspan',script_array[i].colspan);
            curr_cell.innerText=script_array[i].text;
            curr_cell.className=script_array[i].className;
            //curr_row.className=script_array[i].className;
        }

        var typeTitle=the_table.getElementsByClassName("staff_dgrd_category");
        var begin_row_index=-1;
        var found_good=false,phone_header;
        var end_row_index=the_table.rows.length;
        console.log("typeTitle.length="+typeTitle.length);
        console.log("the_table.rows.length="+the_table.rows.length);
        if((phone_header=the_table.getElementsByClassName("staff_dgrd_header_staff_phone")).length>0 &&
           /^[\(\)\d-\s\/]+$/.test(phone_header[0].innerText)) {
            my_query.phonePrefix=phone_header[0].innerText; }
        for(i=0; i < the_table.rows.length; i++) console.log("("+i+"), "+the_table.rows[i].innerText);
        for(k=0; k < 2; k++) {
            for(i=0; i < typeTitle.length; i++) {
                console.log("typeTitle["+i+"]="+typeTitle[i].innerText);
                if(is_right_sport(typeTitle[i].innerText.toLowerCase())) {
                    begin_row_index=typeTitle[i].parentNode.rowIndex+1;
                    if(i < typeTitle.length-1) end_row_index=typeTitle[i+1].parentNode.rowIndex;
                    found_good=true;
                    break;
                }
            }
            if(found_good) break;
            if(k===1) {
                console.log("Could not find right sport in staff_dgrd, submitting anyway");

                reject("Sort of success parse_staff_dgrd");
                return;
            }
            else {
                my_query.short_sport=my_query.sport.replace(/^women\'s\s*/i,"").replace(/^men\'s\s*/i,"");
                console.log("Failed first try, adding short sport="+my_query.short_sport);
            }
        }
        var title_map={"staff_dgrd_fullname": "name", "staff_dgrd_staff_title":"title","staff_dgrd_staff_email":"email","staff_dgrd_staff_phone":"phone"};
        var curr_ret={name:"",title:"",email:"",phone:""},curr_text,ctr=1;
        console.log("begin_row_index="+begin_row_index+", end_row_index="+end_row_index+", length="+the_table.rows.length);
        for(i=begin_row_index; i < end_row_index; i++)
        {
            curr_ret={};
            for(j=0; j < the_table.rows[i].cells.length; j++)
            {
               
                if(title_map[the_table.rows[i].cells[j].className]!==undefined)
                {
                    if(the_table.rows[i].cells[j].className.indexOf("staffEmail")!==-1 )
                    {
                        console.log(the_table.rows[i].cells[j].outerHTML);
                        var inner_a=the_table.rows[i].cells[j].getElementsByTagName("a");
                        if(inner_a.length>0 && inner_a[0].dataset.cfemail!==undefined) {
                            curr_ret[title_map[the_table.rows[i].cells[j].className]]=decryptCloudFlare(the_table.rows[i].cells[j].dataset.cfemail);
                        }
                       else curr_ret[title_map[the_table.rows[i].cells[j].className]]=the_table.rows[i].cells[j].innerText.trim();
                    }
                    else curr_ret[title_map[the_table.rows[i].cells[j].className]]=the_table.rows[i].cells[j].innerText.trim();
                }
            }
            add_fields(curr_ret,ctr);
            ctr++;

        }
        resolve("Success in parse_staff_dgrd");
        return true;
    }
    function parse_staff_php(doc,url,resolve,reject,staffList) {
        console.log("in parse_staff_php");
        my_query.fields.coachsite=url;
        var i,j,table,sec_title,dept=staffList.getElementsByClassName("staff-department");
        var s_name=doc.querySelectorAll(".sport-name"),x;
        for(x of s_name) {
            x.href=MTP.fix_remote_url(x.href,url);
            if(is_right_sport(x.innerText)) {
                my_query.fields.teamsite=x.href;
            }
        }
        if(dept.length===0) dept=staffList.getElementsByClassName("department");
        for(i=0; i < dept.length; i++) {
            sec_title=dept[i].getElementsByClassName("sec_title");
            if(sec_title.length===0) sec_title=dept[i].getElementsByClassName("section-title");
            //console.log("sec_title["+i+"]="+sec_title[0].innerText);
            if(sec_title.length>0 && is_right_sport(sec_title[0].innerText)) {
                console.log("in here");
                parse_inner_staff_php(dept[i]);
                resolve("");
                return;
            }
        }
        console.log("Normal staff_php failed, trying to find table");
        if((table=staffList.querySelector(".staff-table"))) return parse_info_directory_table(doc,url,resolve,reject,table);
        reject("failed parse_staff_php");
    }
    /* helper for parse_staff_php */
    function parse_inner_staff_php(dept) {
        console.log("Parsing inner staff php");
        var i,j,member=dept.getElementsByClassName("member"),ctr=1,ret,curr_elem,inner_span;
        for(i=0; i < member.length; i++) {
            ret={name:"",email:"",title:"",phone:""};
            try {
                if((curr_elem=member[i].getElementsByClassName("name")).length>0) ret.name=curr_elem[0].innerText.trim();
                if((curr_elem=member[i].getElementsByClassName("position")).length>0) ret.title=curr_elem[0].innerText.trim();
                if((curr_elem=member[i].getElementsByClassName("email")).length>0) {
                    if((inner_span=curr_elem[0].getElementsByClassName("__cf_email__")).length>0 &&
                       inner_span[0].dataset.cfemail) ret.email=decryptCloudFlare(inner_span[0].dataset.cfemail);
                    else ret.email=curr_elem[0].innerText.trim();
                }
                if((curr_elem=member[i].getElementsByClassName("phone")).length>0) ret.phone=curr_elem[0].innerText.trim();
                add_fields(ret,ctr);
                ctr++;
            }
            catch(e) { console.log("error "+e); }
        }
    }

    /* get teamsite and coachsite */
    function get_pages_info_directory(doc,url) {
        var possible_pages=doc.querySelectorAll(".level2 > ul > li > a"),x;
        for(x of possible_pages) {
            if(is_right_sport(x.innerText.trim())) {
                my_query.fields.teamsite=x.href;
                my_query.fields.coachsite=x.href.replace(/\/$/,"").replace(/\/index$/,"/coaches/index");
            }
        }

    }

    function parse_info_directory_address(doc,url) {
        var add_div=doc.querySelector(".footer-address p"),dirs;
        if(!add_div) return;
        var add_str="";
        dirs=add_div.querySelector(".gicon-directions");
        if(!dirs) return;
        var curr_sib=dirs.nextSibling;
        while(curr_sib && !/gicon/.test(curr_sib.className)) {
            if(curr_sib.nodeType===Node.TEXT_NODE) {
                add_str=(add_str.length>0?",":"")+curr_sib.textContent;
            }
            curr_sib=curr_sib.nextSibling;
        }
        var parsed_add=new Address(add_str,1);
        add_address(parsed_add);
    }

    /* Need to fix to use promises */
    /* parse pages with /information/directory/index */
    function parse_info_directory(doc,url,resolve,reject) {
        console.log("parse_info_directory,url="+url);
        get_pages_info_directory(doc,url);
        parse_info_directory_address(doc,url);
        var i,j,roster,h2_tag,mainbody=doc.getElementById("mainbody");
        var h2=mainbody.querySelectorAll("h2");
        if((roster=doc.querySelector(".roster")) && roster.length>0) {
            h2=mainbody.getElementsByTagName(roster[0].previousElementSibling.tagName.toLowerCase()); }
        for(i=0; i < h2.length; i++) {
            if(h2[i].innerText.length>0 && is_right_sport(h2[i].innerText)&& h2[i].nextElementSibling &&
               h2[i].nextElementSibling.tagName==="TABLE") return parse_info_directory_table(doc,url,resolve,reject,h2[i].nextElementSibling);
             if(h2[i].innerText.length>0 && is_right_sport(h2[i].innerText)&& h2[i].parentNode && h2[i].parentNode.nextElementSibling &&
               h2[i].parentNode.nextElementSibling.tagName==="TABLE") return parse_info_directory_table(doc,url,resolve,reject,h2[i].parentNode.nextElementSibling);
        }
        console.log("Info directory failed, rejecting");

  //      if(h2.length>=2 && !my_query.submitted && (my_query.submitted=true) && check_and_submit()) return true;
        reject("");
    }

    function add_address(parsed_add) {
        console.log("add_address,parsed_add="+JSON.stringify(parsed_add));
        if(parsed_add && parsed_add.address1) {
            if(/^\s*201[\d]\s+/.test(parsed_add.address1) && /Athletics|University|College/i.test(parsed_add.address1)) {
                parsed_add.address1=parsed_add.address1.replace(/^\s*201[\d]\s*/,"").replace(/^[^\d]+/,""); }
            my_query.fields.address=parsed_add.address1;
        }
        if(parsed_add&&parsed_add.city) my_query.fields.city=parsed_add.city;
        if(parsed_add&&parsed_add.postcode) my_query.fields.zip=parsed_add.postcode;
    }


    function parse_info_directory_staff(doc,url,resolve,reject) {
        console.log("In parse_info_directory_staff");
        var i,j,roster,h2_tag,mainbody=doc.getElementById("mainbody");
        var h4,table=doc.querySelector("#mainbody table"),row,cell;
        console.log("before table");
        if(!table && (reject("")||true)) return;
        console.log("after table");
        var title_map=null;
        for(i=0;i<table.rows.length;i++) {
            row=table.rows[i];
            h4=row.querySelector("strong");
            console.log("i="+i+",h4="+h4+", h4.innerText="+(h4?h4.innerText:""));
            if((h4) && !title_map) title_map=assign_title_map(row);
            else if(h4 && is_right_sport(h4.innerText)) {
                console.log("i="+i+",h4.innerText="+h4.innerText);
                for(j=i+1;j<table.rows.length;j++) {
                    if((h4=table.rows[j].querySelector("h4"))) break; }
                return parse_info_directory_table(doc,url,resolve,reject,table,i,j,title_map);
            }
        }

        reject("failed info_directory_staff");
        return;
    }
    function assign_title_map(header_row) {
        console.log("&&&& assign_title_map on "+header_row.innerText);
        var ret={}, i,curr_cell,prefixMatch,suffixMatch;
        var found={'name':false,'title':false,'phone':false,'email':false};
        for(i=0; i < header_row.cells.length; i++) {
            curr_cell=header_row.cells[i].innerText.toLowerCase();
            if(curr_cell.indexOf("name")!==-1 && !found.name && (found.name=true)) ret[i]="name";
            else if(/title|position/i.test(curr_cell)&&!found.title && (found.title=true)) ret[i]="title";
            else if(/phone|ext/i.test(curr_cell) && !found.phone && (found.phone=true)) {
                ret[i]="phone";
                if((prefixMatch=curr_cell.match(/([\d]{3})\s*[\)-]{1}/))) my_query.phonePrefix=prefixMatch[1];
            }
            else if(curr_cell.indexOf("mail")!==-1 && !found.email && (found.email=true)) {
                ret[i]="email";
                if((suffixMatch=curr_cell.match(/@[A-Z0-9a-z]+\.[A-Z0-9a-z]/))) my_query.at_part=suffixMatch[0];
            }
        }
        console.log("assign_title_map,ret="+JSON.stringify(ret));
        return ret;
    }

    function find_address_generic(doc,url) {
        var footer=doc.querySelectorAll("footer div,footer p,.address,#footer div,#footer p"),parsed_add,x;

        footer.forEach(function(elem) {
            if(elem.querySelector("div")) return;
             var add_str="";
       //    console.log("find_address_generic,elem.innerText="+elem.innerText.trim());

            /*parsed_add=new Address(elem.innerText.trim());
            if(parsed_add&&parsed_add.city) {
                add_address(parsed_add);
                return;
            }*/
            for(x of elem.childNodes) {
                if(x.nodeType===Node.TEXT_NODE) {
                    add_str=add_str+(add_str.length>0?",":"")+x.textContent;
                }
                else if(x.nodeType===Node.ELEMENT_NODE) {
                    add_str=add_str+(add_str.length>0?",":"")+x.innerText;
                }
            }
            add_str=add_str.replace(/^\s*,+/g,"").replace(/,\s*$/,"");
          //  console.log("find_address_generic,add_str="+add_str.trim());
             parsed_add=new Address(add_str);
            if(parsed_add&&parsed_add.city) {
                add_address(parsed_add);
                return;
            }

        });
    }


    function find_extra_php_table(doc,url) {
        var sport=doc.querySelectorAll(".subNavSport a");
        var found_sport=false;
        sport.forEach(function(elem) {
            if(!found_sport&&is_right_sport(elem.innerText.trim())) {
                found_sport=true;
                my_query.fields.teamsite=MTP.fix_remote_url(elem.href,url);
                my_query.fields.coachsite=MTP.fix_remote_url(elem.href,url).replace(/\/sport\//,"/coach/");
            }
        });

    }

    function parse_php_table(doc,url,resolve,reject,the_table) {
        find_extra_php_table(doc,url);
        var i,j,x,typeTitle,begin_row_index=-1,end_row_index=the_table.rows.length;
        if((typeTitle=the_table.getElementsByClassName("staffTypeTitle")).length===0) {
            console.log("length=0");
            typeTitle=the_table.getElementsByClassName("dt-group-title");
        }
        for(i=0; i < typeTitle.length; i++) {
            console.log("typeTitle["+i+"]="+typeTitle[i].innerText);
            if(is_right_sport(typeTitle[i].innerText.toLowerCase())) {
                begin_row_index=typeTitle[i].parentNode.rowIndex+1;
                if(i < typeTitle.length-1) end_row_index=typeTitle[i+1].parentNode.rowIndex;
                break;
            }
        }
        if(begin_row_index===-1) reject("Failed parse_php_table");
        console.log("Got right sport "+begin_row_index+"\t"+end_row_index);
        var title_map={"staffName": "name", "staffPosition":"title","staffEmail":"email","staffPhone":"phone"};
        var curr_ret={name:"",title:"",email:"",phone:""},curr_text,ctr=1;
        for(i=begin_row_index; i < end_row_index; i++) {
            curr_ret={};
            for(j=0; j < the_table.rows[i].cells.length; j++) {
                console.log("the_table.rows["+i+"].cells["+j+"].innerText="+the_table.rows[i].cells[j].innerText);
                if(title_map[the_table.rows[i].cells[j].className]!==undefined)
                {
                    if(the_table.rows[i].cells[j].className.indexOf("staffEmail")!==-1 )
                    {
                        console.log(the_table.rows[i].cells[j].outerHTML);
                        var inner_span=the_table.rows[i].cells[j].getElementsByClassName("__cf_email__");
                        if(inner_span.length>0 && inner_span[0].dataset.cfemail!==undefined)
                        {
                            curr_ret[title_map[the_table.rows[i].cells[j].className]]=decryptCloudFlare(inner_span[0].dataset.cfemail);
                        }
                        else curr_ret[title_map[the_table.rows[i].cells[j].className]]=the_table.rows[i].cells[j].innerText;
                    }
                    else curr_ret[title_map[the_table.rows[i].cells[j].className]]=the_table.rows[i].cells[j].innerText;
                }
            }
            add_fields(curr_ret,ctr);
            ctr++;

        }
        if(ctr>1) {
            resolve("Success on parse_php_table");
            return;
        }

    }
    function print_table_row(the_row,pos) {
        var i,str="";
        if(!pos) pos="";
        for(i=0;i<the_row.cells.length;i++) {
            str=str+(str.length===0?";":"")+the_row.cells[i].innerHTML.trim(); }
        console.log("row["+pos+"]="+str);
    }
    /* parse_info_directory_table is pretty generic */
    function parse_info_directory_table(doc,url,resolve,reject,the_table,begin_row,end_row,title_map) {
        var i,j, x,header,a,row;
        console.log("parse_info_directory_table,begin_row="+begin_row+",end_row="+end_row+",title_map="+title_map);
        if(begin_row===undefined) begin_row=0;
        if(end_row===undefined) end_row=the_table.rows.length;
        header=the_table.rows[begin_row];
        if(header===undefined || header===null) console.log("Error with roster-header");
        if(!title_map) title_map=assign_title_map(header);
        var curr_ret={},curr_text,ctr=1;
        for(i=begin_row+1; i < end_row; i++) {
            curr_ret={};
            row=the_table.rows[i];
            print_table_row(row,i);
            for(x in title_map) {
                if(title_map[x]==="email" && (a=row.cells[x].querySelector("a")) &&
                   /^\s*mailto:/.test(a.href)) curr_ret[title_map[x]]=a.href.replace(/^\s*mailto:\s*/,"");
                else curr_ret[title_map[x]]=row.cells[x].innerText.trim();
            }
            add_fields(curr_ret,i);
        }
        resolve("");
        return true;
    }
    /* parse sidearm for only one sport */
    function parse_sidearm_special(doc,sidearm) {
        console.log("in parse_sidearm_special");
        var title_map=assign_title_map(sidearm.rows[0]);
        var ctr=1,k,curr_ret;
        console.log("title_map="+JSON.stringify(title_map));
        var j=1,curr_th,curr_name,curr_title,curr_email,curr_phone;
        console.log(sidearm.rows[j].className);
        while(j >=0 && j < sidearm.rows.length) {
            curr_ret={};
            if(ctr>10) break;
            console.log("j="+j+", "+sidearm.rows[j].cells.length);
            for(k=0; k < sidearm.rows[j].cells.length; k++) {
                if(title_map[k]!==undefined) curr_ret[title_map[k]]=sidearm.rows[j].cells[k].innerText.trim();
            }
            console.log("clunk curr_ret="+JSON.stringify(curr_ret));
            if(curr_ret.name!==undefined) add_fields(curr_ret,ctr++);
            j++;
        }
        if(ctr===1) return false;
        if(!my_query.submitted && (submit_if_done()||true)) return true;
        return false;
    }
    function parse_sidearm(doc,url,resolve,reject,sidearm) {
        console.log("In parse_sidearm,url="+url);
        get_extra_fields_sidearm2(doc,url)
        var cat=sidearm.getElementsByClassName("sidearm-staff-category");
        if(cat.length===0 && sidearm.rows.length>0) return parse_sidearm_special(doc,sidearm);
        var i,j,k,phone_col,prefixMatch,inner_span,curr_cell;
        var curr_pos=0,next_elem,curr_th,curr_text,ctr=1;
        var curr_name="", curr_title="", curr_phone="", curr_email="";
        if((phone_col=doc.getElementById("col-staff_phone")) &&
           (prefixMatch=phone_col.innerText.match(/([\d]{3})(\)|-)/))) {
            my_query.phonePrefix="("+prefixMatch[1]+")";
            console.log("my_query.phonePrefix="+my_query.phonePrefix); }
        for(i=0; i < cat.length; i++) {
            console.log("cat["+i+"].innerText="+cat[i].innerText.toLowerCase().trim());
            if(is_right_sport(cat[i].innerText.toLowerCase().trim())) {
                j=cat[i].rowIndex+1;
                console.log(sidearm.rows[j].className);
                console.log("***sidearm.rows.length="+sidearm.rows.length+", j="+j);
                while(j >=0 && j < sidearm.rows.length &&
                      (!sidearm.rows[j].className || sidearm.rows[j].className==="" || /sidearm-staff-member/.test(sidearm.rows[j].className))) {
                    console.log("j="+j+", "+sidearm.rows[j].cells.length);
                    curr_th=sidearm.rows[j].getElementsByTagName("th")[0];
                    for(k=0; k < sidearm.rows[j].cells.length; k++)
                    {
                        console.log("for "+k+", "+sidearm.rows[j].cells[k].headers);
                        curr_cell=sidearm.rows[j].cells[k];
                        curr_text=curr_cell.innerText;
                        if((inner_span=curr_cell.getElementsByTagName("span")) && inner_span.length>0 &&
                           curr_text.replace(inner_span[0].innerText,"").trim().length>0) {
                            curr_text=curr_text.replace(inner_span[0].innerText,"").trim(); }
                        else if(inner_span.length>0) { console.log("inner_span[0].innerText="+inner_span[0].innerText); }
                         curr_text=curr_text.trim();
                        if(sidearm.rows[j].cells[k].headers.indexOf("col-fullname")!==-1) curr_name=curr_text;
                        else if(sidearm.rows[j].cells[k].headers.indexOf("col-staff_title")!==-1) curr_title=curr_text;
                        else if(sidearm.rows[j].cells[k].headers.indexOf("col-staff_email")!==-1) curr_email=curr_text;
                        else if(sidearm.rows[j].cells[k].headers.indexOf("col-staff_phone")!==-1) curr_phone=curr_text;
                    }

                    add_fields({name:curr_name,title:curr_title,email:curr_email,phone:curr_phone},ctr++);
                    j++;
                    console.log("Now j="+j);
                }
                console.log("Done loop with j");
                break;
            }
        }
        console.log("Done i loop");
        if(!my_query.submitted && (submit_if_done()||true)) return true;
        console.log("MOO");
        return false;
    }

    function get_extra_fields_sidearm2(doc,url) {
        var add=doc.querySelector("address"),footerdivs,parsed_add;
         my_query.fields.coachsite=url;
        var begin_url=url.replace(/(https?:\/\/[^\/]*).*$/,"$1");
        var my_re=/\/([^\/]*)\/(?:coaches)(?:\/)?$/,my_match;
        if(my_match=url.match(my_re)) {
            my_query.fields.teamsite=begin_url+"/index.aspx?path="+my_match[1];
        }
        else {

            my_query.fields.teamsite=url.replace(/\/[^\.]*\.aspx/,"/index.aspx");
        }
        if(add&&(parsed_add=new Address(add.innerText.trim()))) {
            add_address(parsed_add);
        }
        else if(!add && (footerdivs=doc.querySelectorAll("footer div,span"))) {
            footerdivs.forEach(function(elem) {
                if(elem.querySelector("div")) return;
                if((parsed_add=new Address(elem.innerText.trim())) && parsed_add.city) {
                    add_address(parsed_add); }
            });
        }
        add_to_sheet();
    }

    function parse_sidearm2(doc,url,resolve,reject,sidearm) {
        console.log("In parse_sidearm2,url="+url);
        var i,j, x,begin_row=1;
        var header=sidearm.rows[0];
        get_extra_fields_sidearm2(doc,url);
        if(header===undefined || header===null) console.log("Error with roster-header");
        var title_map=assign_title_map(header);
        var map_ct=0,inner_span;
        for(x in title_map) map_ct++;
        console.log("title_map="+JSON.stringify(title_map));
        if(map_ct===0) {
            begin_row=0;
            title_map={0:"name",1:"title",2:"email",3:"phone"};
        }
        var curr_ret={},curr_text, curr_cell;
        var ctr=1;
        for(i=1; i < sidearm.rows.length; i++)
        {
           //console.log("GADZOOKS: i="+i);
            curr_ret={};
            for(x in title_map) {
                curr_cell=sidearm.rows[i].cells[x];
                if(!curr_cell) continue;
                if(curr_cell&&(inner_span=curr_cell.getElementsByTagName("span"))&&inner_span.length>0 &&
                   curr_cell.innerText.replace(inner_span[0].innerText,"").trim().length>0) {
                    curr_ret[title_map[x]]=curr_cell.innerText.replace(inner_span[0].innerText,"").trim();
                }
                else curr_ret[title_map[x]]=curr_cell.innerText.trim();
            }
            for(j=0; j < sidearm.rows[i].cells.length; j++)
            {
                curr_cell=sidearm.rows[i].cells[j];
                if(curr_cell.getElementsByTagName("a").length>0 && /^mailto:/.test(curr_cell.getElementsByTagName("a")[0].href))
                {
                    var temp_str=curr_cell.getElementsByTagName("a")[0].href.replace(/^mailto:(\s*|\s*%20)/,""),temp_match;
                    temp_str=temp_str.replace(/^%20/,"");
                    console.log("temp_str="+temp_str);
                    temp_match=temp_str.match(email_re);
                    if(temp_match!==null) { curr_ret.email=temp_match[0]; }
                }
            }
            try { add_fields(curr_ret,i); }
            catch(error) { reject("Error adding fields in parse_sidearm2"); }
        }
       resolve("Success in parse_sidearm2");
    }
    function add_to_query(name, title, email, phone) {
        console.log("Name="+name+", title="+title+", email="+email+", phone="+phone);
        my_query.curr_pos=my_query.curr_pos+1;
        if(/Main (Phone|Fax)/.test(name)) return false;
        var the_name=MTP.parse_name(name),email_match;
        if(my_query.phonePrefix.length>0 && phone.length>0) phone=my_query.phonePrefix+" "+phone;
        if(my_query.curr_pos<=10)
        {
            document.getElementById("First Name (Coach #"+my_query.curr_pos+")").value=the_name.fname;
            document.getElementById("Last Name (Coach #"+my_query.curr_pos+")").value=the_name.lname;
            document.getElementById("Job Title (Coach #"+my_query.curr_pos+")").value=title;
            if(email_match=email.match(email_re)) email=email_match[0];
            else email="";
            document.getElementById("Email Address (Coach #"+my_query.curr_pos+")").value=email;
            document.getElementById("Phone Number (Coach #"+my_query.curr_pos+")").value=phone;
        }
    }   
    function prefix_in_string(prefixes, to_check) {
        var j;
        for(j=0; j < prefixes.length; j++) {
            if(to_check.indexOf(prefixes[j])===0) return true; }
        return false;
    }
    function is_right_sport(sports_str) {
        if(sports_str.length===0) return false;
        if(/^lady/i.test(sports_str)) my_query.found_lady=true;
        sports_str=sports_str.replace(/s+\|.*$/,"").replace(/\s*(mailing )?address:.*$/,"");
        sports_str=sports_str.replace(/^\s*M\./,"Men's").replace(/^\s*W\./,"Women's");
        sports_str=sports_str.replace(/cross country(\s*[\/-]{1}|\s*(&|and)\s*)/i,"").replace(/(\s|,)Coach[a-z]*/i,"").replace(/’/g,"'")
        .replace(/^(Head|Assistant)\s*/i,"").replace(/\\'/g,"'").replace(/\(f\).*$/,"").replace(/\|.*$/,"").trim();
        sports_str=sports_str.replace(/\s*[\d\-]+$/,"").replace(/\\\'/g,"'").replace(/\s\s+/g," ")
            .replace(/^(.*) [-]{1,2} (.*en(?:\'s)?)$/,"$2 $1").replace(/\//," and ");
        sports_str=sports_str.replace(/^(.*) \(([^\)]+)\)$/,function(match,p1,p2)
                                      {
            console.log("in function replace");
            if(p2.toLowerCase()==="m") { return "Men's "+p1; }
            else if(p2.toLowerCase()==="w") { return "Women's "+p1; }
            else if(p2.indexOf("&")!==-1 || p2.indexOf(" and ")!==-1 || p2.indexOf("men's/women's")!==-1) {
                if(my_query.sport.indexOf("Men's")!==-1) {
                return "Men's "+p1; }
                else return "Women's "+p1;
            }
            else if(/women/i.test(p2)) { return "Women's "+p1; }
            else if(/^men/i.test(p2)) { return "Men's "+p1; }
            return p1+" "+p2;
        });
        sports_str=sports_str.replace(/^([^\(]+)\s+\(([^\)]+)\).*$/,"$2 $1").replace(/(Outdoor )?Track (&|and) Field/i,"Track")
        .replace(/indoor and outdoor track/i,"Track");
        sports_str=sports_str.replace(/^((?:Men)|(?:Women))\s/i,"$1's ");
        sports_str=sports_str.replace(/Men(\'s)?\s*(?:and|&)\s*Women(\'s)?\s*/i, function(match) {
            if(my_query.sport.indexOf("Men's")!==-1) {
                return "Men's "; }
            else return "Women's ";
        });
        if(/Diving/i.test(my_query.sport)) sports_str=sports_str.replace(/\s*Swimming\s+(&|and)/i,"");
        sports_str=sports_str.replace(/^.*(Baseball|Softball)/i,"$1").replace(/[\s\-]{2,}.*$/,"").replace(/^([^,]+),\s*(.*)/,"$2 $1");
        //console.log("new sports_str="+sports_str);
        if((my_query.short_sport.length>0 && my_query.short_sport.trim().toLowerCase().indexOf(sports_str.toLowerCase()) === 0) ||
           my_query.sport.trim().toLowerCase().indexOf(sports_str.trim().toLowerCase())===0
          || sports_str.trim().toLowerCase().indexOf(my_query.sport.trim().toLowerCase())===0 || (
            my_query.short_sport.length>0 && sports_str.trim().toLowerCase().indexOf(my_query.short_sport.toLowerCase())===0
        && !my_query.other_gender_regex.test(sports_str.trim))) {
            console.log("Good sport");
            return true;
        }
        if((my_query.found_lady||/track/i.test(my_query.short_sport)) &&
           sports_str.trim().toLowerCase().indexOf(my_query.short_sport.toLowerCase())!==-1) return true;
        return false;
    }
    function sports_search(resolve,reject) {
        var domain_URL=my_query.url;
          if(domain_URL.indexOf(".pdf")!==-1) domain_URL=domain_URL.replace(/\/[^\.\/]+\.pdf.*$/,"/");
        let promise=MTP.create_promise(domain_URL,sports_response,resolve,reject);
        return;
    }
    function get_domain_only2(the_url) {
        var httpwww_re=/https?:\/\/www\./;
        var http_re=/https?:\/\//;
        var slash_re=/\/.*$/;
        var ret=the_url.replace(httpwww_re,"").replace(http_re,"").replace(slash_re,"");
        ret=ret.replace(/.*\.([^\.]+\.[^\.]+)$/,"$1");
        return ret;
    }
    /* Following the finding the district stuff */
    function sports_promise_then(to_parse) { }
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

     function add_to_sheet() {
        var x,field;
        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=true;;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && my_query.has_sport && my_query.fields.email==="NO BASEBALL") {
            console.log("Bad has baseball");
            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;
        }
        is_done_dones=is_done;
        for(x in my_query.fields) {
            if(my_query.fields[x]==='') { console.log("bad x="+x);  is_done=false; }
        }
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(!is_done && is_done_dones) {
            console.log("Bad missing fields");
            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;
        }
        else if(!my_query.done.address) {
            if(my_query.last_good_url&&!(my_query.fields.city&&my_query.fields.phone&&my_query.fields.address)) {
               /* var add_promise=MTP.create_promise(my_query.last_good_url,Address.scrape_address,add_promise_then,function() {
                    my_query.done.address=true;
                    submit_if_done(); },{depth:1});*/
                my_query.try_count={"address":0};

                let search_str=MTP.get_domain_only(my_query.last_good_url,true)+" baseball address";
                 const addPromise = new Promise((resolve, reject) => {
                     query_search(search_str, resolve, reject, query_response,"address"); })
            .then(add_promise_then).catch(function(val) { console.log("Failed add " + val);
                                                        my_query.done.address=true;
                                                         submit_if_done();
                                                        });
            }
            else {
                            my_query.done.address=true;
                submit_if_done();
            }
        }
    }
    function add_promise_then(result) {
        Address.addressList.sort(Address.cmp);
        console.log("add_promise_then! "+JSON.stringify(Address.addressList));
        if(Address.addressList.length>0 && Address.addressList[0].city && !(my_query.fields.address&&my_query.fields.city&&my_query.fields.zip)) {
            add_address(Address.addressList[0]); }

        my_query.done.address=true;
        submit_if_done();
    }

    function add_no_baseball_btn() {
        var my_span=document.createElement("span");
        var inp=document.createElement("input");
        Object.assign(inp,{type:"button",value:"NO BASEBALL"});
        my_span.style="margin: 0px 10px;";
        my_span.appendChild(inp);
        document.querySelector("#submitButton").parentNode.insertBefore(my_span,document.querySelector("#submitButton"));
        inp.addEventListener("click",fill_no_baseball_btn);
    }

    function fill_no_baseball_btn(e) {
        var x;
        for(x in my_query.fields) {
            my_query.fields[x]="NO BASEBALL"; }
        add_to_sheet();
    }

    function is_bad_school() {
        var re_str="(^\s*(Argosy Uni|Antonelli C|Associated Tech|Fortis |Cortiva Ins|Golden Gate Universi|Harrison College\-|Ivy Tech|"+
        "Herzing University|ECPI University\-|Everglades University|Strayer |Virginia College\s*\-))|"+
            "Career College|(Beauty)|( Cosmetology)"+
            "([ \s]Beauty( |\s|$))|(Hair(\s|$))|( Massage(\s|$))|( Bartending)|( Seminary)";
        var my_re=new RegExp(re_str);
        if(my_re.test(my_query.name)) return true;
        return false;
    }

    function init_Query() {
        var dept_regex_lst=[/Coach/];

        var title_regex_lst=[/Admin|Administrator|Supervisor|Manager|Director|Founder|Owner|Officer|Secretary|Assistant|Coach/i];
        //var promise=MTP.create_promise(
        var query={dept_regex_lst:dept_regex_lst,
                       title_regex_lst:title_regex_lst,id_only:false,default_scrape:false,debug:false};
        Gov.query=query;
        var wT=document.querySelector("#DataCollection table");
        var school_url=wT.rows[1].cells[1].querySelector("a").href;
        my_query={school_url:school_url,name:wT.rows[0].cells[1].innerText.trim(),sport:"Baseball",short_sport:"Baseball", curr_pos: 0, try_count: 0,
                  doneRedirect: false, doneNewUrl: false, doneCoaches: false, doneSorry: false,phonePrefix:"",
                 subQueryList:[],doneSubQueries:0,at_part:"",found_lady:false,
                 fields:{contactname:"",role:"",email:"",phone:"",address:"",city:"",zip:"",teamsite:"",coachsite:""},
                 done:{"address":false},
                 try_count_lst:{"address":0}};

        //my_query.url=my_query.school_url;
        add_no_baseball_btn();

        if(is_bad_school()) {
           fill_no_baseball_btn();
            my_query.done.address=true;
            submit_if_done();
            return;
        }
      
   
        console.log("my_query="+JSON.stringify(my_query));
        var search_str, search_URI, search_URIBing;
        const sportsPromise = new Promise((resolve, reject) => { sports_search(resolve, reject); })
        .then(sports_promise_then).catch(function(val) {
           console.log("Failed dist " + val);
            search_str=my_query.name +" athletics website";// -site:.edu"; //
            const queryPromise = new Promise((resolve, reject) => { query_search(search_str, resolve, reject, query_response,"query"); })
            .then(query_promise_then).catch(function(val) { console.log("Failed dist " + val);
                                                          GM_setValue("returnHit"+MTurk.assignment_id,true);
                                                          });
        });
    }

})();