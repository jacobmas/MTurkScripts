// ==UserScript==
// @name         ParseSchoolDirectoriesErnest
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  3c school dir parse
// @author       You
// @include     *trystuff.com*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect http*tryshit.com*
// @connect githubusercontent.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';;
    var my_query = {};
    var bad_urls=[];
    var Schools={
        contact_list:[],
        page_regex_str:"(www\\.|\/\/)(apptegy|catapultk12|cms4schools)\\.com|crescerance\\.com|cyberschool\\.com|"+
        "echalk\\.com|edlio\\.com|edlioschool\\.com|edline\\.net|educationalnetworks\\.net|"+
        "eschoolview\\.com|finalsite\\.com|foxbright\\.com|gabbart\\.com|gaggle\\.net|ilearnschools\\.org|"+
        "schooldesk\\.net|schoolloop\\.com|"+
        "www\\.school(blocks|insites|messenger|pointe|webmasters)\\.com|"+
        "socs\\.fes\\.org|www\\.zumu\\.com",
        script_regex_lst:[{regex:/apptegy_cms\//,name:"apptegy"}],
        split_lines_regex:/\s*\n\s*|\s*\t\s*|–|(\s+-\s+)|\||                     |	|	|●|•|\s{3,}|\s+\*\s+/,
        AL:{spreadsheet:true},AK:{},AZ:{},AR:{},CA:{},CO:{},CT:{},DE:{},DC:{spreadsheet:true},FL:{spreadsheet:true},GA:{
        spreadsheet:true},HI:{},ID:{},IL:{spreadsheet:true},IN:{spreadsheet:true},IA:{spreadsheet:true},KS:{},KY:{},LA:{spreadsheet:true},
        ME:{},MD:{},MA:{},MI:{},MN:{},MS:{},MO:{},MT:{spreadsheet:true},NE:{},NV:{},NH:{},NJ:{},NM:{},NY:{spreadsheet:true},NC:{},ND:{},OH:{spreadsheet:true},OK:{},OR:{},
        PA:{},RI:{},SC:{},SD:{},TN:{},TX:{},UT:{},VT:{},VA:{},WA:{},WV:{},WI:{},WY:{},
        init_Schools:function(query) {
            var x;
            for(x in query) Schools[x]=query[x];

            const schoolPromise=new Promise((resolve,reject) => {
                if(Schools[Schools.state].spreadsheet) Schools.get_spreadsheet(resolve,reject);
                else if(Schools[Schools.state]&&Schools[Schools.state].get_state_dir) Schools[Schools.state].get_state_dir(resolve,reject);

                else resolve("");
            });
            return schoolPromise;
        },
        get_spreadsheet:function(resolve,reject) {
            console.log("In Schools.get_spreadsheet");
        var url="https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/School/CSV/"+Schools.state+".csv";
        var promise=MTP.create_promise(url,Schools.parse_spreadsheet,resolve,reject);
    }
		};
    var MTurk=new MTurkScript(45000,200,[],begin_script,"A1PZPYT7WHUD89");
    var MTP=MTurkScript.prototype;
 

    /* TODO: Schools.matches_name checks if a given name matches the desired school's name, needs lots of work I assume */
    Schools.matches_name=function(name) {
        var the_regex=/[\.\']+/g,dash_regex=/-/g;
        var and_regex=/(&amp;|&)\s/g;
        var short_school=this.name.replace(the_regex,"").replace(dash_regex," ").replace(and_regex,"and ").replace(/(\s)\s+/g,"$1").toLowerCase().trim();
        var short_name=name.replace(the_regex,"").replace(and_regex,"and ").replace(dash_regex," ").replace(/(\s)\s+/g,"$1").toLowerCase().trim();
       // console.log("short_school="+short_school+", short_name="+short_name);
        if(short_name.length===0) return false;
        if(short_name.indexOf(short_school)!==-1 || short_school.indexOf(short_name)!==-1) {
            console.log("Matched on short_name="+short_name+", short_school="+short_school);
            return true; }
        if(short_name.split(" ")[0].indexOf(short_school.split(" ")[0])===0 ||
           short_school.split(" ")[0].indexOf(short_name.split(" ")[0])===0) {
            console.log("First match on short_name="+short_name+", short_school="+short_school); }
        return false;
    };
    /* Note: Matches undefined cities too
    TODO: Deal with Mount/Mt. Saint/St. etc shit
    */
    Schools.matches_city=function(city) {
        if(Schools.city===undefined || Schools.city===null) return true;
        var short_mycity=Schools.city.toLowerCase().trim(),short_city=city.toLowerCase().trim();
        //console.log("short_mycity="+short_mycity+", short_city="+short_city);
        return short_mycity===short_city;
    };
    /* TODO: actually create */
    Schools.matches_address=function(parsed_add) {
        return false; };
    /* Schools.matches_title_regex is a function to check if a title matches something in
    * the query in Schools.title_regex */
    Schools.matches_title_regex=function(title) {
        for(var i=0; i < Schools.title_regex.length; i++) if(title.match(Schools.title_regex[i])) return true;
        return false;
    };
    /* Find the staff directory in a systematic way, curr_type is the type of page being done */
    Schools.find_dir=function(doc,url,resolve,reject,curr_type) {
        var links=doc.links,i;
        var domain=MTP.get_domain_only(url);

        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url);
            if(MTP.get_domain_only(links[i].href)!==domain) continue;
            if(curr_type.href_rx.test(links[i].href) &&
               curr_type.text_rx.test(links[i].innerText.trim())) {
                console.log(domain+": resolving on "+links[i].innerText+",url="+links[i].href);
                resolve(links[i].href); return; }
        }
        console.log(domain+": could not find, resolving on base "+url);
        resolve(url);
    };
    /* TODO: needs work other possible locations of staff directory exist */
    Schools.find_dir_eschoolview=function(doc,url,resolve,reject,count) {
        if(count===undefined || typeof(count)==="object") count=0;
        console.log("in find_dir_eschoolview, url="+url+" ,count="+count);
        var links=doc.links,i,promise;

        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url);

            if(/Staff Directory/i.test(links[i].innerText)) {
                console.log("Resolving on "+links[i].href); resolve(links[i].href); return; }
        }
        console.log("Done for");
        if(count++===0 && (promise=MTP.create_promise(Schools.base+"/ContactUs.aspx",Schools.find_dir_eschoolview,resolve,reject,count))) return;
        else { console.log("Resolving on StaffDirectory.aspx"); resolve(Schools.base+"/StaffDirectory.aspx"); }

    };
   
     /* Schools.parse_name_func parses the name partially for a school person, primarily as a helper for parse_data_func */
    Schools.parse_name_func=function(text) {
        var split_str,fname,lname,i;
        var appell=[/^Mr\.\s*/,/^Mrs\.\s*/,/^Ms\.\s*/,/^Miss\s*/,/^Dr\.\s*/],suffix=[/,?\s*Jr\.?/];
        for(i=0; i < appell.length; i++) text=text.replace(appell[i],"");
        if(/[a-z]{2,}/.test(text)) {
            text=text.replace(/(,?\s*[A-Z]+)$/,""); }
        for(i=0; i < suffix.length; i++) text=text.replace(suffix[i],"");
        return text.replace(/^([^,]+),\s*(.*)$/,"$2 $1");
    };
    /* Schools.parse_data_func parses text for a school person */
    Schools.parse_data_func=function(text) {
        var ret={};
        var fname="",lname="",i=0,j=0, k=0;
        var curr_line, s_part="", second_arr,begin_name;
        var has_pasted_title=false;
        if((text=text.trim()).length===0) return ret;
        var split_lines_1=(text=text.trim()).split(Schools.split_lines_regex),split_lines=[],temp_split_lines,new_split;
        var found_email=false;
        if(/^[^\s]+\s+[^\s]+,\s*[A-Z\.]*[^A-Z\s\n,]+/.test(split_lines_1[0])) {
            split_lines=split_lines_1[0].split(",").concat(split_lines_1.slice(1));
        }
        else split_lines=split_lines_1;
        if(/:/.test(split_lines[0])) split_lines=split_lines[0].split(":").concat(split_lines.slice(1));
        split_lines=split_lines.filter(line => line);
        /** Additional code **/
        if(/Director|Principal|Teacher|Superintendent/.test(split_lines[0]) &&
           (temp_split_lines=split_lines.splice(0,1))) split_lines.splice(1,0,temp_split_lines[0]);
        /** End additional code **/

        console.log("parse_data_func: "+JSON.stringify(split_lines));
        var good_stuff_re=/[A-Za-z0-9]/,bad_stuff_re=/([a-z]{1}[^\s]*\s[a-z]{1}[^\s]*\s[a-z]+)|(^Wh.*\?$)|(\sand\s)|([\d]+)/;
        if(split_lines===null) return;
        for(j=0; j < split_lines.length; j++)
        {
            if(split_lines.length>0 && split_lines[j] && split_lines[j].trim().length > 0
               && good_stuff_re.test(split_lines[j]) && !bad_stuff_re.test(split_lines[j])) break;
        }
        if(j>=split_lines.length) return ret;
        var split_comma=split_lines[j].split(/,/);
        if(split_comma.length===2 && /[^\s]\s/.test(split_comma[0])) {
            // console.log("Doing split_comma");
            var curr_last=split_lines.length-1;
            split_lines.push(split_lines[curr_last]);
            for(k=curr_last; k>=j+2; k--) split_lines[k]=split_lines[k-1];
            split_lines[j]=split_comma[0];
            split_lines[j+1]=split_comma[1];
        }
        if(split_lines.length>0 && j<split_lines.length &&
           split_lines[j] && split_lines[j].trim().length > 0) {
            if(!/\s/.test((begin_name=split_lines[j].trim()))
               && j+1 < split_lines.length) begin_name=begin_name+" "+split_lines[(j++)+1];
            ret.name=Schools.parse_name_func(begin_name);
        }
        // console.log("split_lines.length="+split_lines.length);
        for(i=j+1; i < split_lines.length; i++)
        {
            found_email=false;
            if(split_lines[i]===undefined || !good_stuff_re.test(split_lines[i])) continue;
            //  console.log("i="+i+", split_lines[i]="+split_lines[i]);
            curr_line=split_lines[i].trim();

            second_arr=curr_line.split(/:\s+/);
            if(/Title:/.test(curr_line) && (ret.title=curr_line.replace(/.*Title:\s*/,"").trim())) continue;
            //  console.log("curr_line="+curr_line+", second_arr.length="+second_arr.length);
            s_part=second_arr[second_arr.length-1].trim();
            //console.log("s_part="+s_part);
            if(email_re.test(s_part) && (found_email=true)) ret.email=s_part.match(email_re)[0];
            else if(phone_re.test(s_part)) ret.phone=s_part.match(phone_re)[0];
            else if(s_part.length>10 && s_part.substr(0,10)==="Phone Icon" &&
                    phone_re.test(s_part.substr(11))) ret.phone=s_part.substr(11).match(phone_re)[0];
            else if((s_part.trim().length>0  && !has_pasted_title) || s_part.indexOf("Title:")!==-1)
            {
                if(/^ext/.test(s_part)) ret.phone=(ret.phone+" "+s_part.trim()).trim();
                else if(has_pasted_title=true) ret.title=s_part.replace(/^Title:/,"").trim();
            }
        }
        return ret;
    };

    /**  Schools.init_search Initializes Schools search, a create_promise style function
     * input page should've been identified already as the directory page
     */
    /* Schools.call_parser is a helper function to create a promise for the school parser */
    Schools.call_parser=function(url) {
        var promise=MTP.create_promise(url,Schools.curr_school.parser,Schools.resolve,Schools.reject);
    };
    Schools.trim_name=function(str) {
        return str.replace(/(^|\s)School(\s|$)/g,"").replace(/(^|\s)Elementary|High|Middle|Junior|Intermediate(\s|$)/g,"").trim();
    };
    /** Schools.init_SchoolSearch initializes the School search create_promise thing given we've gotten a url already
     * query: {type: string, name:string,title_regex:[]} will be an object where type is either district or school
     * and TODO: name is a name of school or blank depending on whether we got sent a url or not as initial data
     * for now deal with name as name, title_regex is a list of titles
     */
    Schools.init_SchoolSearch=function(doc,url,resolve,reject,query) {
        var curr_school,promise,parse_url;
        Schools.base=url.replace(/\/$/,"")
        Schools.url=url.replace(/(https?:\/\[^\/]*).*$/,"$1");
        console.log("Schools.init_SchoolSearch, url="+url+", query="+JSON.stringify(query));
        Schools.resolve=resolve;Schools.reject=reject;Schools.type=query.type;Schools.name=query.name;
        Schools.title_regex=query.title_regex;Schools.title_str=query.title_str;
        Schools.page_type=Schools.id_page_type(doc,url,resolve,reject,query);
        Schools.curr_school=Schools[Schools.page_type];
        console.log("page_type="+Schools.page_type);

        /* Base is the base page for a school if we're in a district/system page */
        if((curr_school=Schools[Schools.page_type])&&curr_school.find_base&&Schools.type==="school") {
            console.log("searching for base "+JSON.stringify(Schools[Schools.page_type]));
            Schools.base=curr_school.find_base(doc,url+(curr_school.base_suffix?curr_school.base_suffix:"")).replace(/\/$/,""); }
        console.log("Schools.base="+Schools.base);
        /* if suffix we can immediately head to the directory parser */
        if(curr_school && curr_school.suffix) {
            console.log("# heading immediately to directory");
            Schools.call_parser(Schools.base+curr_school.suffix); }
        else if(curr_school && curr_school.find_directory) {
            console.log("# Finding directory");
            promise=MTP.create_promise(Schools.base,curr_school.find_directory,Schools.call_parser,MTP.my_catch_func,curr_school);
        }
        else if(!curr_school) { console.log("School page_type not defined parsing yet, trying parse_none");



                              }
        else { console.log("Weird shouldn't be here"); }
    };
    /** Schools.parse_spreadsheet parses a spreadsheet in the School/CSV directory called via MTP.create_promise,
    ensures matching of city and school name via Schools.matches_name, Schools.matches_city
    */
    Schools.parse_spreadsheet=function(doc,url,resolve,reject) {
        var split_lines=doc.body.innerHTML.split("\n"),i,curr_line;
        var title_map=Schools.get_spreadsheet_title_map(split_lines[0].split(",")),curr_contact,temp_contact=null,x;
        console.log("title_map="+JSON.stringify(title_map));
        for(i=1;i<split_lines.length;i++) {
            curr_line=split_lines[i].split(",");
            curr_contact={};
            for(x in title_map) curr_contact[x]=curr_line[title_map[x]];
            if(title_map.first!==undefined&&title_map.last!==undefined) curr_contact.name=title_map.first+" "+title_map.last;
            curr_contact.address=parseAddress.parseLocation(curr_contact.street+","+curr_contact.city+","+curr_contact.state+" "+curr_contact.zip);
            if(curr_contact.school.length>0 && Schools.matches_name(curr_contact.school) && Schools.matches_city(curr_contact.city)
              && curr_contact.email.indexOf("@")!==-1) Schools.contact_list.push(curr_contact);
            else if(!temp_contact && curr_contact.school.length>0 && Schools.matches_name(curr_contact.school)) temp_contact=curr_contact;
            else if(!temp_contact && curr_contact.address && Schools.address && curr_contact.address.number===Schools.address.number &&
                    curr_contact.address.street===Schools.address.street && curr_contact.address.type===Schools.address.type &&
                    curr_contact.city===Schools.city && curr_contact.state===Schools.state) temp_contact=curr_contact;
        }
        if(Schools.contact_list.length===0 && temp_contact) Schools.contact_list.push(temp_contact);
        resolve("");
    };
    Schools.get_spreadsheet_title_map=function(line) {
        var ret={},i,x,term_map={"school":/School/i,"name":/Name/i,"title":/Title|Position/i,"phone":/Phone|Telephone/i,
                                "email":/E(-)?mail/i,"street":/Street|Address/i,"city":/City/i,"state":/state/i,"zip":/zip/i,
                                "first":/First/i,"last":/Last/i};
        for(i=0;i<line.length;i++) for(x in term_map) if(term_map[x].test(line[i])) ret[x]=i;
        return ret;
    };
    /* Probably should change to have a specific function for the script using the School thing */
    Schools.parse_promise_then=function(result) {
        console.log("parse_promise_then: result="+JSON.stringify(Schools.contact_list));
    }
    function removeCookies() {
        var cookies = document.cookie.split("; ");
        for (var c = 0; c < cookies.length; c++) {
            var d = window.location.hostname.split(".");
            while (d.length > 0) {
                var cookieBase = encodeURIComponent(cookies[c].split(";")[0].split("=")[0]) + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' + d.join('.') + ' ;path=';
                var p = location.pathname.split('/');
                document.cookie = cookieBase + '/';
                while (p.length > 0) {
                    document.cookie = cookieBase + p.join('/');
                    p.pop();
                };
                d.shift();
            }
        }
    }
    Schools.AK.get_state_dir=function(resolve,reject) {
    var url="https://education.alaska.gov/DOE_Rolodex/SchoolCalendar/Home/Search?term="+Schools.name.replace(/\s/g,"+");
    var promise=MTP.create_promise(url,Schools.AK.get_school_search,resolve,reject);
    };
    Schools.AK.get_school_search=function(doc,url,resolve,reject) {
        var table=doc.getElementById("myTable"),i,row,next_url="",url_lst,promise;
        if(/\/SchoolDetails\//.test(url) && Schools.AK.parse_school_details(doc,url,resolve,reject)) return true;
        for(i=0;i<table.rows.length;i++) {
            if((row=table.rows[i])&&row.cells.length>=2 && /School/.test(row.cells[1].innerText) &&
               Schools.matches_name(row.cells[0].innerText.trim()) && (url_lst=row.cells[0].getElementsByTagName("a")).length>0
               && (next_url=MTP.fix_remote_url(url_lst[0].href,url))) break;
        }
        if(next_url.length>0) promise=MTP.create_promise(next_url,Schools.AK.parse_school_details,resolve,reject);
        else resolve("");
        return true;

    };
    Schools.AK.parse_school_details=function(doc,url,resolve,reject) {
        var lst=doc.getElementsByClassName("list-value")[0].children,i,label,value,x,curr_contact={},web,split_text;
        var match_map={"address":/^Physical Address/,"phone":/^Telephone/,"low":/^Lowest Grade/,"high":/^Highest Grade/};
        for(i=0;i<lst.length;i++) {
            label=lst[i].getElementsByTagName("h3");
            value=lst[i].getElementsByTagName("div");
            if(label.length===0 || value.length===0) continue;
            for(x in match_map) if(match_map[x].test(label[0].innerText)) curr_contact[x]=value[0].innerText.trim();
            if(/School Website/.test(label[0].innerText)&&
               (web=value[0].getElementsByTagName("a")).length>0) curr_contact.url=web[0].href;
            if(/Contact Name/.test(label[0].innerText)) {
                split_text=value[0].innerText.trim().split(", ");
                curr_contact.name=split_text[0];
                if(split_text.length>1) curr_contact.title=split_text[1];
                if((web=value[0].getElementsByTagName("a")).length>0) curr_contact.email=web[0].href.replace(/^\s*mailto:\s*/,"");
            }
        }
        Schools.contact_list.push(curr_contact);
        resolve("");
        return true;
    };
    Schools.AZ.get_state_dir=function(resolve,reject) {
        var search_str=Schools.name+" site:ade.az.gov/edd";
        Schools.AZ.query_search(search_str,resolve,reject,Schools.AZ.query_response);
    };
    Schools.AZ.query_response=function(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var search, b_algo, i=0, inner_a,b_url, b_name, b_caption,p_caption,b1_success=false;
        try {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                if(Schools.matches_name(b_name.split(" - ")[0].trim()) && (b1_success=true)) break;
            }
            if(b1_success && Schools.AZ.query_promise_then({url:b_url,resolve:resolve,reject:reject})) return true;
        }
        catch(error) { console.log("Error in AZ.query_response" + error); }
        reject("Nothing found");
        return;
    }
    /* Search on bing for search_str, parse bing response with callback */
    Schools.AZ.query_search=function(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        console.log(search_URIBing);
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) {
                               callback(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }
    Schools.AZ.query_promise_then=function(result) {
         var promise=MTP.create_promise(result.url,Schools.AZ.parse_ADE_school,result.resolve,result.reject);
        return true;
    };
    Schools.AZ.parse_ADE_school=function(doc,url,resolve,reject) {
        console.log("AZ.parse_ADE_school,url="+url);
        var blue=doc.querySelectorAll("td[bgcolor='darkblue']"),i,a,new_url,promise;
        var contactTable=blue[1].parentNode.parentNode.parentNode,districtTable=blue[3].parentNode.parentNode.parentNode,row,cells;
        if(districtTable.rows.length>1 && (a=districtTable.querySelector("a"))) new_url=MTP.fix_remote_url(a.href,url).replace(/\.gov\//,".gov/edd/");
        Schools.curr_contact={};
        for(i=0;i<contactTable.rows.length;i++) {
            if((cells=contactTable.rows[i].cells)&&/Principal/.test(cells[0].innerText)) {
                Schools.curr_contact={name:cells[1].innerText.trim(),title:"Principal",phone:cells[2].innerText.trim()}; }
        }
        if(new_url&&Schools.curr_contact.name) promise=MTP.create_promise(new_url,Schools.AZ.parse_ADE_district,resolve,reject);
        else resolve();
        return true;
    };
    Schools.AZ.parse_ADE_district=function(doc,url,resolve,reject) {
        console.log("AZ.parse_ADE_district,url="+url);
        var blue=doc.querySelectorAll("td[bgcolor='darkblue']"),i,a,new_url,promise;
        var contactTable=blue[1].parentNode.parentNode.parentNode,row,cells;
        for(i=0;i<contactTable.rows.length;i++) {
            if((cells=contactTable.rows[i].cells)&&cells.length>=4 && cells[1].innerText.trim()===Schools.curr_contact.name &&
               (Schools.curr_contact.email=cells[3].innerText.trim())) {
                Schools.contact_list.push(Schools.curr_contact);
                break; }
        }
        resolve("");
    };
    Schools.AR.get_state_dir=function(resolve,reject) {
        var url="https://adedata.arkansas.gov/spd/Home/schools";
        var promise=MTP.create_promise(url,Schools.AR.grab_token,resolve,reject);
    };
    /* Grab token and query */
    Schools.AR.grab_token=function(doc,url,resolve,reject) {
        var token=doc.getElementsByName("__RequestVerificationToken")[0].value;
        var data={"__RequestVerificationToken":token,"AlphabetKey":"","SearchValue":Schools.name.replace(/\s/g,"+"),"TitleId":"",
                  "SortField":"DirectoryName"};
        var data_str=MTP.json_to_post(data).replace(/%2B/g,"+");
        var headers={"Content-Type": "application/x-www-form-urlencoded","host":"adedata.arkansas.gov","origin":"https://adedata.arkansas.gov",
                     "referer":"https://adedata.arkansas.gov/spd/Home/schools","Upgrade-Insecure-Requests":"1"};
        GM_xmlhttpRequest({method: 'POST', url: url,data:data_str,headers:headers,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               Schools.AR.get_school_info(doc,response.finalUrl, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    };
    Schools.AR.get_school_info=function(doc,url,resolve,reject) {
        var item=doc.getElementsByClassName("data-item"),i,result=[],curr_person;
        if(item.length===0 && (resolve(result))) return;
        var grp=item[0].getElementsByClassName("tbl-group-item");
        for(i=0;i<grp.length; i++) {
            if((curr_person=Schools.parse_data_func(grp[i].innerText.replace(/(^|\n)[^\n]*:\s*\n/g,""))) &&
               Schools.matches_title_regex(curr_person.title)) result.push(curr_person);
        }
        resolve(result);
    };
    Schools.CA.get_state_dir=function(resolve,reject) {
        var url="https://www.cde.ca.gov/SchoolDirectory/districtschool?allSearch="+Schools.name.replace(/\s/g,"+")+"&simpleSearch=Y&page=0&tab=3";
        var promise=MTP.create_promise(url,Schools.CA.get_school_search,resolve,reject);
    };
    Schools.CA.get_school_search=function(doc,url,resolve,reject) {
        if(/\/details\?/.test(url) && Schools.CA.parse_school(doc,url,resolve,reject)) return;
        var table=doc.getElementsByTagName("table")[0],i,row,next_url,promise;
        //        console.log("table.outerHTML="+table.outerHTML);
        for(i=0;i<table.rows.length;i++) {
            if((row=table.rows[i]).cells.length>=4 && Schools.matches_name(row.cells[3].innerText.trim())
               && (next_url=row.cells[3].getElementsByTagName("a")).length>0) break;
        }
        if(next_url.length>0) promise=MTP.create_promise(MTP.fix_remote_url(next_url[0].href,url),Schools.CA.parse_school,resolve,reject);
        else resolve("");
        return true;
    };
    Schools.CA.parse_school=function(doc,url,resolve,reject) {
        var table=doc.getElementsByClassName("table"),i,row,curr_contact;
        for(i=0;i<table[0].rows.length;i++) {
            row=table[0].rows[i];
            curr_contact={};
            if(row.cells.length<2) continue;
            if(/Administrator|Chief Business Official|CDS Coordinator/.test(row.cells[0].innerText)) {
                curr_contact=Schools.parse_data_func(row.cells[1].innerText.replace(/\n\n+\s*/g,"\n")); }
            if(curr_contact && curr_contact.name&&curr_contact.title&&curr_contact.email) Schools.contact_list.push(curr_contact);
        }
        resolve("");
        return true;
    };
    Schools.HI.get_state_dir=function(resolve,reject) {
        var url="http://www.hawaiipublicschools.org/ParentsAndStudents/EnrollingInSchool/SchoolFinder/Pages/home.aspx";

        var promise=MTP.create_promise(url,Schools.HI.get_state_dirA,resolve,reject);
    }
    Schools.HI.get_state_dirA=function(doc,url,resolve,reject) {
        var url2="http://www.hawaiipublicschools.org/ParentsAndStudents/EnrollingInSchool/SchoolFinder/Pages/home.aspx?fk="+encodeURIComponent(Schools.name);
        console.log("url="+url);
        var headers={"Host":"www.hawaiipublicschools.org","referer":"http://www.hawaiipublicschools.org/ParentsAndStudents/EnrollingInSchool/SchoolFinder/Pages/home.aspx",
                     "Upgrade-Insecure-Requests":1};
        GM_xmlhttpRequest({method: 'GET', url: url2,headers:headers,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               Schools.HI.get_school_search(doc,response.finalUrl, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
        // var promise=MTP.create_promise(url,Schools.HI.get_school_search,resolve,reject);
    };
    Schools.HI.get_school_search=function(doc,url,resolve,reject) {
        console.log("MOO "+doc.body.innerHTML);
        var result=doc.getElementsByClassName("school-search-result"),i,inner_a;
        for(i=0;i<result.length;i++) {
            if((inner_a=result[i].getElementsByTagName("a")).length>0) { console.log("inner_a[0].innerText="+inner_a[0].innerText+", "+inner_a[0].href); }
        }
    };
    Schools.KY.get_state_dir=function(resolve,reject) {
        var url="https://openhouse.education.ky.gov/Directory/Search";
        var headers={"Content-Type":"application/x-www-form-urlencoded","host":"openhouse.education.ky.gov",
                     "origin":"https://openhouse.education.ky.gov","referer":"https://openhouse.education.ky.gov/Directory",
                     "upgrade-insecure-requests": "1"};
        var data_str="search="+Schools.name.replace(/\s/g,"+")+"&x=0&y=0";
        GM_xmlhttpRequest({method: 'POST', url: url,data:data_str,headers:headers,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               Schools.KY.get_school_search(doc,response.finalUrl, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    };
    Schools.KY.get_school_search=function(doc,url,resolve,reject) {
        var result=doc.getElementById("schoolResult"),table,i,row,next_url="",inner_a,text,parsed;
        var new_url="https://openhouse.education.ky.gov/Directory/School/",data;
        var promise,scripts=result.getElementsByTagName("script"),reg1=/^.*kendoGrid\(/,reg2=/\);\}\);/;
        try {
            text=scripts[0].innerHTML.trim().replace(reg1,"").replace(reg2,"");
            data=JSON.parse(text).dataSource.data.Data;
            for(i=0;i<data.length;i++) {
                if(Schools.matches_name(data[i].SCH_NAME) && (
                    promise=MTP.create_promise(new_url+data[i].SCH_ORG_ID,Schools.KY.parse_school,resolve,reject))) return;
            }
        }
        catch(error) { console.log("Error parsing="+error); resolve(""); }
        return true;
    };
    Schools.KY.parse_school=function(doc,url,resolve,reject) {
        var dist_info=doc.getElementsByClassName("DistrictInfo")[0].innerText,i,curr_contact={},j,tables,row,inner_a;
        tables=doc.querySelectorAll(".SchoolDetails table");
        Schools.school_phone=dist_info.match(/Phone:\s*(.*)/)[1];
        Schools.school_url=dist_info.match(/Web:\s*(.*)/)[1];
        for(i=0;i<tables.length;i++) {
            for(j=0;j<tables[i].rows.length; j++) {
                row=tables[i].rows[j];
                if(row.length<3) continue;
                curr_contact={name:row.cells[1].innerText.trim(),phone:Schools.school_phone,title:row.cells[0].innerText.trim(),
                              email:(inner_a=row.cells[2].getElementsByTagName("a")).length>0 ? inner_a[0].href.replace(/\s*mailto:\s*/,"") : ""};
                if(curr_contact.name.length>0 && curr_contact.email.length>0 && curr_contact.title.length>0) Schools.contact_list.push(curr_contact);

            }
        }
        resolve("");
        return true;

    };
    Schools.MA.get_state_dir=function(resolve,reject) {
        var url="http://profiles.doe.mass.edu/search/search.aspx?leftNavId=11238";
        var promise=MTP.create_promise(url,Schools.MA.begin_state_dir,resolve,reject);
    };
    Schools.MA.begin_state_dir=function(doc,url,resolve,reject,response) {
        console.log("in MA.begin_state_dir "+url);
        //console.log("response="+JSON.stringify(response));
        var query_url="http://profiles.doe.mass.edu/search/search.aspx?leftNavId=11238";
        var form=doc.querySelector("form#aspnetForm"),x;
        var headers={"Content-Type":"application/x-www-form-urlencoded","host":"profiles.doe.mass.edu",
                     "origin":"http://profiles.doe.mass.edu","referer":"http://profiles.doe.mass.edu/search/search.aspx?leftNavId=11238",
                    "Upgrade-Insecure-Requests": "1"};
        var data={},i,j,inp=form.querySelectorAll("input,select"),sel=form.getElementsByTagName("select"),data_str;
        for(i=0;i<inp.length;i++) if((inp[i].tagName==="INPUT" && (inp[i].type==="hidden"||inp[i].type==="text"||
                                    ((inp[i].type==="radio"||inp[i].type==="checkbox") && inp[i].checked)|| (inp[i].type==="submit"&&inp[i].value==="Get Results")))
                                     || inp[i].tagName==="SELECT") data[inp[i].name]=inp[i].value;
        var submit=form.querySelector("input[type='submit']");
        data.ctl00$ContentPlaceHolder1$orgtype="6,13";
    //    for(x in data) { console.log(" "+x+": "+data[x]); }
        data_str=MTP.json_to_post(data).replace(/%20/g,"+");
       // console.log("data_str="+data_str);
        GM_xmlhttpRequest({method: 'POST', url: query_url,data:data_str,headers:headers,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               Schools.MA.get_school_result_list(doc,response.finalUrl, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }});
    };
    Schools.MA.get_school_result_list=function(doc,url,resolve,reject) {
        console.log("In Schools.MA.get_school_result_list,url="+url);
        var table=doc.querySelector("#ctl00_ContentPlaceHolder1_lblSearchResults").querySelectorAll("table")[1];
        var row1,row2,i,lg,match,lg_regex=/^([\d]+)\.\s*([^:]*):\s*([^\(]*)\s+\(([\d]+)\)/,curr_contact;
        var principal_regex=/Principal:\s*(.*)/,phone_regex=/P:\s*([\d]{3}-[\d]{3}-[\d]{4})/;
        var searchindent,right,a,address,parse_add;
        for(i=0;i<table.rows.length;i+=2) {
            lg=table.rows[i].querySelector(".lg");
//            console.log("lg.innerText="+lg.innerText);
          /*  if((match=lg.innerText.match(lg_regex)) && Schools.matches_name(match[3])) {
                console.log("table.rows["+(i+1)+"].outerHTML="+table.rows[i+1].outerHTML); }*/
            if((match=lg.innerText.match(lg_regex)) && (searchindent=table.rows[i+1].querySelector(".searchindent"))
              && (right=table.rows[i+1].querySelector(".right")) &&
              (Schools.matches_name(match[3]) ||
               ((address=searchindent.innerText.split("\n")[1]) && (parse_add=parseAddress.parseLocation(address)) && Schools.matches_address(parse_add)))) {
                curr_contact={name:(match=searchindent.innerText.match(principal_regex))?match[1]:"",title:"Principal",
                              phone:(match=searchindent.innerText.match(phone_regex))?match[1]:"",email:(match=right.querySelector("a").innerText.trim())};
                Schools.contact_list.push(curr_contact);
                break;
            }
        }
        resolve("");
    }
    Schools.MI.get_state_dir=function(resolve,reject) {
        var url="https://www.cepi.state.mi.us/eem/EntitySearchQuick.aspx";
        var promise=MTP.create_promise(url,Schools.MI.begin_state_dir,resolve,reject);
    };
    Schools.MI.begin_state_dir=function(doc,url,resolve,reject,response) {
        console.log("in MI.begin_state_dir "+url);
        //console.log("response="+JSON.stringify(response));
        var query_url="https://www.cepi.state.mi.us/eem/EntitySearchQuick.aspx";
        var form=doc.querySelector("form"),x;
        var headers={"Content-Type":"application/x-www-form-urlencoded","host":"www.cepi.state.mi.us",
                     "origin":"https://www.cepi.state.mi.us","referer":"https://www.cepi.state.mi.us/eem/EntitySearchQuick.aspx",
                    "Upgrade-Insecure-Requests": "1"};
        var data={},i,j,inp=form.querySelectorAll("input,select"),sel=form.getElementsByTagName("select"),data_str;
        for(i=0;i<inp.length;i++) if((inp[i].tagName==="INPUT" && (inp[i].type==="hidden"||inp[i].type==="text"||
                                    ((inp[i].type==="radio"||inp[i].type==="checkbox") && inp[i].checked)|| (inp[i].type==="submit"&&inp[i].value==="Search")))
                                     || inp[i].tagName==="SELECT") data[inp[i].name]=inp[i].value;
        var submit=form.querySelector("input[type='submit']");
        data["ctl00$cphMain$txtName"]=Schools.trim_name(Schools.name);
        if(Schools.city!==undefined&&Schools.city.length>0) data["ctl00$cphMain$txtCity"]=Schools.city;
        if(Schools.zip!==undefined&&Schools.zip.length>0) data["ctl00$cphMain$txtZip"]=Schools.zip;
       // for(x in data) { console.log(" "+x+": "+data[x]); }
        data_str=MTP.json_to_post(data).replace(/%20/g,"+");
       // console.log("data="+JSON.stringify(data));
        //console.log("data_str="+data_str);
        GM_xmlhttpRequest({method: 'POST', url: query_url,data:data_str,headers:headers,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               Schools.MI.get_school_result_list(doc,response.finalUrl, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }});
    };
    Schools.MI.get_school_result_list=function(doc,url,resolve,reject) {
        console.log("in MI.get_school_result, url="+url);
        var query_url="https://www.cepi.state.mi.us/eem/EntitySearchQuick.aspx";
      //  console.log("doc.body.innerHTML="+doc.body.innerHTML);
        var grid=doc.querySelector(".grid"),row,form=doc.querySelector("form");
        var data={},i,j,inp=form.querySelectorAll("input,select"),sel=form.getElementsByTagName("select"),data_str;
        var col=0;
        if(!grid && Schools.name.indexOf(" ")!==-1) {
            Schools.name=Schools.name.split(" ")[0];
            var promise=MTP.create_promise(url,Schools.MI.begin_state_dir,resolve,reject);
            return;
        }
        else if(!grid) { console.log("FAiled"); GM_setValue("returnHit",true); return; }
        for(i=1;i<grid.rows.length;i++) {
            if((row=grid.rows[i])&&/School/.test(row.cells[4].innerText)) break;
            else console.log("("+i+"), row.cells[4].innerText="+row.cells[4].innerText);
            console.log("grid.rows["+i+"]="+grid.rows[i].innerHTML);
        }
        col=(i-1);
        var headers={"Content-Type":"application/x-www-form-urlencoded","host":"www.cepi.state.mi.us",
                     "origin":"https://www.cepi.state.mi.us","referer":"https://www.cepi.state.mi.us/eem/EntitySearchQuick.aspx",
                    "Upgrade-Insecure-Requests": "1"};

         for(i=0;i<inp.length;i++) if((inp[i].tagName==="INPUT" && (inp[i].type==="hidden"||inp[i].type==="text"||
                                    ((inp[i].type==="radio"||inp[i].type==="checkbox") && inp[i].checked)||
                                                                  (inp[i].type==="submit"&&inp[i].value==="Search")))
                                    || inp[i].tagName==="SELECT") data[inp[i].name]=inp[i].value;
        if(col>=inp.length-1 && resolve("")) return;
        data["__EVENTTARGET"]="ctl00$cphMain$grdCommon$grdCommon";
        data["__EVENTARGUMENT"]="$"+(col).toString();
       // for(x in data) { console.log(" "+x+": "+data[x]); }
        data_str=MTP.json_to_post(data).replace(/%20/g,"+");
        GM_xmlhttpRequest({method: 'POST', url: query_url,data:data_str,headers:headers,
                           onload: function(response) {

                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               Schools.MI.parse_school_result(doc,response.finalUrl, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }
    Schools.MI.parse_school_result=function(doc,url,resolve,reject) {
        console.log("in MI.parse_school_result "+url);
        var email=doc.getElementById("ctl00_cphMain_ctlEmailReadOnly");
        if(email) { console.log("email.innerText="+email.innerText); }
        var curr_contact={},i;
        var table=doc.getElementById("ctl00_cphMain_tabID_grdContacts"),row;
        for(i=1;i<table.rows.length;i++) {
            console.log("row["+i+"].innerText="+table.rows[i].innerHTML);
            if((row=table.rows[i]) &&  /Principal|Administrator|Director/.test(row.cells[1].innerText)) {
                curr_contact={name:row.cells[2].innerText,title:row.cells[1].innerText,phone:row.cells[3].innerText,
                              email:email.innerText.replace(/^[\d]+\./,"")};
               // console.log("Shroo");
                Schools.contact_list.push(curr_contact);
                //console.log("CHOO");
            }
        }
        resolve("");
    };
    Schools.NE.get_state_dir=function(resolve,reject) {
        console.time("NE");
        var url="http://educdirsrc.education.ne.gov/CustomStaffA.aspx";
        var promise=MTP.create_promise(url,Schools.NE.begin_state_dir,resolve,reject,0);
    };
    Schools.NE.begin_state_dir=function(doc,url,resolve,reject,count) {
        console.log("in NE.begin_state_dir,count="+count+",url="+url);
        var query_url=url;
        var form=doc.querySelector("form"),x;
        var headers={"Content-Type":"application/x-www-form-urlencoded","host":"educdirsrc.education.ne.gov",
                     "origin":"http://educdirsrc.education.ne.gov","referer":url,"Upgrade-Insecure-Requests": "1"};
        var data={},i,j,inp=form.querySelectorAll("input,select"),sel=form.getElementsByTagName("select"),data_str;
        for(i=0;i<inp.length;i++) if((inp[i].tagName==="INPUT" && (/text|hidden/i.test(inp[i].type)||
                                       (/radio|checkbox/i.test(inp[i].type) && inp[i].checked)|| (inp[i].type==="submit"&&/Continue/i.test(inp[i].value))))
                                     || inp[i].tagName==="SELECT") data[inp[i].name]=inp[i].value;
        var E_cklist=["CoDistNum","County","Address","Phone","Subject","Position","email"];
        if(count>=0 && count<=2) data["_ctl0:NDEDS_page:RadioButtonList1"]="1";
        if(count===0) data["__EVENTTARGET"]="_ctl0$NDEDS_page$RadioButtonList1$1";
        else if(count===1) {
            data["__EVENTTARGET"]="_ctl0$NDEDS_page$ck_showprivate";
            delete data["_ctl0:NDEDS_page:DDList1"]; }
        if(count>0&&count<=2) {
            data["_ctl0:NDEDS_page:ck_showpublic"]="on";
            data["_ctl0:NDEDS_page:ck_showprivate"]="on"; }
        if(count===2 && !(data["_ctl0:NDEDS_page:DDList1"]=Schools.NE.get_school_code(doc.querySelector("#_ctl0_NDEDS_page_DDList1")))) {
            console.log("Failed to find School");
            resolve("");
            return;
        }
        if(count===3||count===4) data["_ctl0:NDEDS_page:RadioButtonList1"]="0";
        if(count===5) for(i=0;i<E_cklist.length;i++) data["_ctl0:NDEDS_page:ck"+E_cklist[i]]="on";


        //for(x in data) { console.log(" "+x+": "+data[x]); }
        data_str=MTP.json_to_post(data).replace(/%20/g,"+");
       //console.log("data="+JSON.stringify(data));
        //console.log("data_str="+data_str);
        GM_xmlhttpRequest({method: 'POST', url: query_url,data:data_str,headers:headers,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               if(count>=0 && count<=5) Schools.NE.begin_state_dir(doc,response.finalUrl,resolve,reject,count+1);
                               else if(count===6) Schools.NE.get_results(doc,response.finalUrl, resolve, reject);
                           },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }});
    };
    /* Find the school code in the query_selector */
    Schools.NE.get_school_code=function(sel) {
        var ops=sel.options,i,split_op;
        for(i=0;i<ops.length;i++) {
            split_op=ops[i].innerText.split(" - ");
            if(Schools.matches_name(split_op[0]) && Schools.matches_city(split_op[1])) return ops[i].value;
        }
        return null;
    };

    Schools.NE.get_results=function(doc,url,resolve,reject) {
        console.log("Schools.NE.get_results,url="+url);
        var table=doc.querySelector("#_ctl0_NDEDS_page_DataGrid1"),row,i,curr_contact;
        if(!table && (resolve("")||true)) return;
        for(i=1;i<table.rows.length;i++) {
            row=table.rows[i];
            curr_contact={name:row.cells[3].innerText.trim()+" "+row.cells[2].innerText.trim(),first:row.cells[3].innerText.trim(),last:row.cells[2].innerText.trim(),
                          title:row.cells[7].innerText,subject:row.cells[8].innerText,query_url:url,
                          phone:row.cells[14].innerText,email:row.cells[16].innerText};
            console.log("curr_contact="+JSON.stringify(curr_contact));
            Schools.contact_list.push(curr_contact);
        }
        console.timeEnd("NE");
        resolve("");
    };
    Schools.NJ.get_state_dir=function(resolve,reject) {
        var url="https://homeroom5.doe.state.nj.us/directory/school.php",data="school="+encodeURIComponent(Schools.name)+"&source=02";
        var headers={"Content-Type":"application/x-www-form-urlencoded","host":"homeroom5.doe.state.nj.us",
                     "origin":"https://homeroom5.doe.state.nj.us","referer":"https://homeroom5.doe.state.nj.us/directory/pub.php"};
        GM_xmlhttpRequest({method: 'POST', url: url,data:data,headers:headers,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               Schools.NJ.get_school_info(doc,response.finalUrl, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    };
    /* TODO: May want to play with matching the city here, e.g. Mt to Mount shit */
    Schools.NJ.get_school_info=function(doc,url,resolve,reject) {
        var d_box=doc.getElementsByClassName("district_box"),i,tab,curr_text,result={},split_text;
        var temp_name,temp_addressLine1,temp_city,temp_state;
        for(i=0;i<d_box.length;i++) {
            if((tab=d_box[i].getElementsByTagName("table")).length===0) continue;
            curr_text=d_box[i].innerText.replace(tab[0].innerText,"").replace(/\s*\n\s*\n+/g,"\n").trim();
            split_text=curr_text.split("\n");
            temp_name=split_text[3].replace(/\s*\([\d]+\).*$/,"");
            temp_city=split_text[5].split(", ")[0];
            if(Schools.matches_name(temp_name) && Schools.matches_city(temp_city) &&
               resolve(Schools.NJ.parse_table(tab[0]))) return;
        }
    };
    Schools.NJ.parse_table=function(tab) {
        var result=[],i,curr_field={},split_text,j,match;
        for(i=0;i<tab.rows.length;i++) {
            split_text=tab.rows[i].cells[0].innerText.split(", ");
            curr_field={name:Schools.parse_name_func(split_text[0].trim()),title:split_text[1].trim()};
            split_text=tab.rows[i].cells[1].innerText.split("\n");
            for(j=0;j<split_text.length;j++) {
                if(match=split_text[j].match(email_re)) curr_field.email=match[0];
                else if(match=split_text[j].match(phone_re)) curr_field.phone=match[0];
            }
            if(Schools.matches_title_regex(curr_field.title)) result.push(curr_field);
        }
        return result;
    };
    Schools.NY.query_response=function(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a,b_url, b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false,b_header_search,b_context,parsed_context,parsed_lgb;
        try {
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
                p_caption="";
                if((b_caption=b_algo[i].getElementsByClassName("b_caption")).length>0 &&
                   b_caption[0].getElementsByTagName("p").length>0) p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(true && (b1_success=true)) break;
            }
            if(b1_success) {
                Schools.NY.query_promise_then({url:b_url,resolve:resolve,reject:reject});
                return;
            }
        }
        catch(error)
        {
            reject(error);
            return;
        }
        reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;
    }
    /* Search on bing for search_str, parse bing response with callback */
    Schools.NY.query_search=function(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        console.log(search_URIBing);
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) {
                               console.log("MOO");
                               callback(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }
    Schools.NY.query_promise_then=function(result) {
         var promise=MTP.create_promise(result.url,Schools.NY.parse_inst,result.resolve,result.reject);
    };
    Schools.NY.get_state_dir=function(resolve,reject) {
        console.log("IN Schools.NY.get_state_dir");
        var url="https://portal.nysed.gov/pls/sedrefpublic/SED.sed_inst_qry_vw$.startup";
        var search_str=Schools.name+" site:nysed.gov/pls";
        Schools.NY.query_search(search_str,resolve,reject,Schools.NY.query_response);
    /*    GM_xmlhttpRequest({method: 'GET', url: url,timeout:15000,
                               onload: function(response) {
                                   Schools.cookies=[];
                                   var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                                   console.log(JSON.stringify(response));
                                   var match=response.responseHeaders.match(/set-cookie:(.*)/);
                                  // console.log("match="+JSON.stringify(match));


                                   //console.log(count+":response="+JSON.stringify(response));
                                     //console.log(count+":document.cookie="+document.cookie);
                                   Schools.NY.begin_school_dir(doc,response.finalUrl,resolve,reject);
                                  //  Schools.NY.do_list_request(new_url,count+1,resolve,reject);
                                  },
                               onerror: function(response) { reject("Fail"); },
                               ontimeout: function(response) { reject("Fail"); }
                              });*/
      //  var promise=MTP.create_promise(url,Schools.NY.begin_school_dir,resolve,reject);
    };
    /* TODO: multiple tries if first is bad */
    Schools.NY.begin_school_dir=function(doc,url,resolve,reject) {
        console.log("IN Schools.NY.begin_school_dir, url="+url);
        console.log("document.cookie="+document.cookie);
        var new_url="https://portal.nysed.gov/pls/sedrefpublic/sed_inst_qry_vw$sed_inst_qry_v.actionquery";
        var headers={"Content-Type": "application/x-www-form-urlencoded","host":"portal.nysed.gov",
                     "origin":"https://portal.nysed.gov",
                     "referer":"https://portal.nysed.gov/pls/sedrefpublic/SED.sed_inst_qry_vw$.startup"};
        var form=doc.querySelector("[name='sed_inst_qry_vw$sed_inst_qry_v$QForm']");
        var data={},inp=form.querySelectorAll("input"),i,data_str;
        for(i=0;i<inp.length;i++) if(/text|hidden/.test(inp[i].type)) data[inp[i].name]=inp[i].value;
        if(Schools.city) data.P_CITY=Schools.city;
        if(Schools.name) data.P_SEARCH_NAME=Schools.name+"%";
        data_str=MTP.json_to_post(data).replace(/%20/g,"+");
        GM_xmlhttpRequest({method: 'POST', url: new_url,data:data_str,headers:headers,
                           onload: function(response) {
                               console.log("BEGIN_DIR: response="+JSON.stringify(response));
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               Schools.NY.get_school_list(doc,response.finalUrl, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    };
    Schools.NY.get_school_list=function(doc,url,resolve,reject) {
        console.log("### Schools.cookies="+JSON.stringify(Schools.cookies));
        console.log("in NY.get_school_list, url="+url);
        var i,table=doc.querySelector("table"),row,new_url,inner_a;
        if(!table) {
            console.log("doc.body.innerHTML="+doc.body.innerHTML); }
        for(i=1;i<table.rows.length;i++) {
            console.log("table.rows["+i+"].cells[0]="+table.rows[i].cells[0].innerText);
            if((row=table.rows[i]) && row.cells.length>=1 && (table.rows.length===2 || Schools.matches_name(row.cells[0].innerText))
              && (inner_a=row.querySelector("a")) && (new_url=MTP.fix_remote_url(inner_a.href,url))) break;
        }
        if(!new_url) { resolve(""); return; }
        console.log("new_url="+new_url);

        var scripts=doc.getElementsByTagName("script"),curr_script;
    /*    for(i=0;i<scripts.length;i++) {
            curr_script=document.createElement("script");
            curr_script.innerHTML=scripts[i].innerHTML;
            document.head.appendChild(curr_script); }*/

        //delete_cookie("SEDREF_QUERY_STRING");
        delete_cookie("__unam");


        console.log("Before: document.cookie="+document.cookie);

        Schools.NY.do_list_request(new_url,0,resolve,reject);

       setTimeout(function() { var promise=MTP.create_promise(new_url,Schools.NY.parse_inst,resolve,reject); }, 1000);

    };
    Schools.NY.do_list_request=function(new_url,count,resolve,reject) {
        console.log(count+":new_url="+new_url);
      //  setCookie("OAMAuthnCookie_portal.nysed.gov:443","cowwDPYJejnJswQp1mNxPa3XC66cTIMPm%2BhdfNv9Vm3Mq8Y3MZTRhy3cnYpwwYWY%2Bc84hrAeoFjqBJ%2BA5GXLYQCuh7XisXyYz0hgLRxP6vZb93H5PPANfe0uLt%2B0CTsayIoQRwEK2NPRz3J0qNRyKJtqkNWJkGVi0HKGjEEn4UhvmmN6hVKuipIsrHWC8yyfxpr%2Bxi1n94KiROE1%2FyrzVHoZq4c67%2FPZK41Ime2MC5n7nK9Hk1ZysfYqpslOjRlVZcBm%2FIu34RSsCmFxtHXoMiCbcvnmYVF905BVZiN88POl4c1NPYSYCwQ4zgHigXintiJn0Ol4V139q88fYnsZI9zIXTLao8NkF%2BV4YUbgTEf8I7ZgWDwDz6Q1i9IiVtCoI7wfsIaiLlFJ1nTYPrqF3A%3D%3D;");
        //delete_cookie("OAMRequestContext_portal.nysed.gov:443_342b61");
        var i;
        for(i=0;i<Schools.cookies.length;i++) {
            setCookie(Schools.cookies[i].name,Schools.cookies[i].value,2);
        }
        var headers={"host":"portal.nysed.gov","referer":"https://portal.nysed.gov/pls/sedrefpublic/sed_inst_qry_vw$sed_inst_qry_v.actionquery",
                     "origin":"https://portal.nysed.gov",
                   };
        if(count===0||count===1||count===2)
        {
            GM_xmlhttpRequest({method: 'GET', url: new_url,headers:headers,
                               onload: function(response) {
                                   console.log(JSON.stringify(response));
                                   var match=response.responseHeaders.match(/set-cookie:(.*)/);
                                  // console.log("match="+JSON.stringify(match));
                                   var split_match=match[1].split(/,\s*/);
                                   var temp_match,i;
                                   for(i=0;i<split_match.length;i++) {
                                       console.log("split_match.length="+split_match.length);
                                       temp_match=split_match[i].match(/^([^\=]+)\=(.*)$/);
                                       console.log("temp_match="+JSON.stringify(temp_match));

                                   }
                                   setCookie(temp_match[1],temp_match[2],2);




                                   console.log(count+":response="+JSON.stringify(response));
                                     console.log(count+":document.cookie="+document.cookie);
                                    Schools.NY.do_list_request(new_url,count+1,resolve,reject);
                                  },
                               onerror: function(response) { reject("Fail"); },
                               ontimeout: function(response) { reject("Fail"); }
                              });
        }
        else {
            console.log("MOO"); }

    };
    /* TODO: for now just gets a single contact but others are available */
    Schools.NY.parse_inst=function(doc,url,resolve,reject) {
        console.log("in NY.parse_inst, url="+url);
        var table=doc.getElementsByTagName("table"),i,row,a,promise;
        for(i=0;i<table.length;i++) {
            if(/Admin Pos Type/.test(table[i].rows[0].cells[0].innerText)) break;
        }
        if(i>=table.length) { resolve(""); return; }
        else table=table[i];
        for(i=1;i<table.rows.length;i++) {
            console.log("row["+i+"].innerText="+table.rows[i].cells[1].innerText);
            if((row=table.rows[i]) && /Principal|Administrator|Director|Leader/i.test(row.cells[1].innerText) &&
              (a=row.querySelector("a")))  break;
        }
        if(!a) { resolve(""); return; }
        var the_url=MTP.fix_remote_url(a.href,url);
        console.log(the_url);
        promise=MTP.create_promise(MTP.fix_remote_url(a.href,url),Schools.NY.parse_contact,resolve,reject);
    };
    Schools.NY.parse_contact=function(doc,url,resolve,reject) {
        console.log("NY.parse_contact,url="+url);
        var curr_contact={};
        var term_map={"H_FNAME":"first","H_LNAME":"last","H_TITLE":"title"},x,term;
        for(x in term_map) if(term=doc.querySelector("[name='"+x+"']")) curr_contact[term_map[x]]=term.value;
        var table=doc.getElementsByTagName("table")[1],i,row,cell;
        for(i=1;i<table.length;i++) {
            row=table.rows[i];
            cell=row.cells[0];
            if(/PHONE/i.test(cell.innerText)) curr_contact.phone=row.cells[1].innerText+
                (row.cells[2].innerText.length>0?" x"+row.cells[2].innerText:"");
            else if(/EMAIL/i.test(cell.innerText)) curr_contact.email=row.cells[1].innerText;
        }
        Schools.contact_list.push(curr_contact);
        resolve("");


    };
    Schools.NC.get_state_dir=function(resolve,reject) {
        var url="http://apps.schools.nc.gov/ords/f?p=125:1:::NO:::";
        var promise=MTP.create_promise(url,Schools.NC.begin_state_dir,resolve,reject,0);
    };


    Schools.NC.begin_state_dir=function(doc,url,resolve,reject,count) {
        console.log("in NC.begin_state_dir,url="+url);
        function my_json_to_post(lst) {
            var str="",x;
            for(i=0;i<lst.length;i++) str=str+(str.length>0?"&":"")+encodeURIComponent(lst[i].name)+"="+encodeURIComponent(lst[i].value);
            return str.replace(/%20/g,"+").replace(/\(/g,"%28").replace(/\)/g,"%29");
        }
        var query_url="http://apps.schools.nc.gov/ords/wwv_flow.accept"
        var form=doc.querySelector("form"),x;
        var headers={"Content-Type":"application/x-www-form-urlencoded","host":"apps.schools.nc.gov",
                     "origin":"http://apps.schools.nc.gov","referer":"http://apps.schools.nc.gov/ords/f?p=125:1:::NO:::"};
        var data={},i,j,inp=form.querySelectorAll("input,select"),sel=form.getElementsByTagName("select"),data_str,data_list=[];
        for(i=0;i<inp.length;i++) { if((inp[i].tagName==="INPUT" && (/text|hidden/i.test(inp[i].type)||
                                       (/radio|checkbox/i.test(inp[i].type) && inp[i].checked)))
                                     || inp[i].tagName==="SELECT") data_list.push({name:inp[i].name,value:inp[i].value}); }
        for(i=0;i<data_list.length;i++) if(data_list[i].name==="p_request") data_list[i].value="Go_Name";

        data_str=my_json_to_post(data_list);
        console.log("data_str="+data_str);
        GM_xmlhttpRequest({method: 'POST', url: query_url,data:data_str,headers:headers,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               Schools.NC.get_results(doc,response.finalUrl, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }});
    };
    Schools.NC.get_results=function(doc,url,resolve,reject) {
        console.log("Schools.NC.get_results, url="+url);
        var table=doc.querySelector(".t15ReportsRegion"),row,i,a,match,new_url;
        if(!table || !(table=table.querySelector(".t15standardalternatingrowcolors"))) { resolve(""); return; }
        for(i=1;i<table.rows.length;i++) {
            console.log("table.rows[i].innerText="+table.rows[i].innerText);
            if((row=table.rows[i]) && row.cells.length>=4&&Schools.matches_name(row.cells[2].innerText)&&
               Schools.matches_city(row.cells[5].innerText)&&
               (a=row.cells[3].querySelector("a")) &&
               (match=a.href.match(/\?.*$/)) && (new_url="http://apps.schools.nc.gov/ords/f"+match[0])) break;
        }
        if(!new_url) { resolve(""); return; }
        var promise=MTP.create_promise(new_url,Schools.NC.parse_school_results,resolve,reject);
    };
    Schools.NC.parse_school_results=function(doc,url,resolve,reject) {
        console.log("Schools.NC.parse_school_results, url="+url);
        var optional=doc.querySelectorAll(".t15optionalwithhelp"),x,i,curr_contact={},sib;
        var term_map={"url":/Web Address/,name:/Principal\/Director/,email:/Email Address/,phone:/Office Phone/};
        for(i=0;i<optional.length;i++) {
            sib=optional[i].parentNode.nextElementSibling;
            for(x in term_map) {
                if(optional[i].innerText.match(term_map[x])) curr_contact[x]=x==="phone"?sib.innerText.trim():sib.querySelector("span").innerText.trim();
            }
        }
        curr_contact.title="Principal";
        curr_contact.name=Schools.parse_name_func(curr_contact.name.replace(/(Mr|Dr|Ms|Mrs)\s/,"$1. ").trim());
        Schools.contact_list.push(curr_contact);
        resolve("");
    };

    Schools.UT.get_state_dir=function(resolve,reject) {
        var url="https://www.schools.utah.gov/School/GetList";
        GM_xmlhttpRequest({method: 'GET', url: url,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               Schools.UT.parse_schools_dir(doc,response.finalUrl, resolve, reject,response); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    };
    /** TODO:  add option to check if more than name matches */
    Schools.UT.parse_schools_dir=function(doc,url,resolve,reject,response) {
        var parsed,i,schools,curr_contact={"state":"UT"},x;
        var term_map={"PrincipalName":"name","PrincipalTitle":"title","PrincipalEmail":"email","URL":"url","Phone":"phone","Address1":"street",
                      "City":"city","Zip":"zip","GradeLow":"low","GradeHigh":"high"};
        try {
            schools=(parsed=JSON.parse(response.responseText)).Schools;
            for(i=0;i<schools.length;i++) {
                if(Schools.matches_name(schools[i].SchoolName)) {
                    for(x in term_map) if(schools[i][x] || schools[i][x]===0) curr_contact[term_map[x]]=schools[i][x];
                    if(curr_contact.name&&curr_contact.title&&curr_contact.email) Schools.contact_list.push(curr_contact);
                    break; }
            }
        }
        catch(error) { console.log("Error parsing JSON in Schools.UT.parse_schools_dir "+error); }
        resolve("");
    };
    Schools.WI.get_state_dir=function(resolve,reject) {
        var url="https://apps4.dpi.wi.gov/SchoolDirectory/Search/DisplayPublicSchools";
        var headers={"Content-Type": "application/x-www-form-urlencoded","host":"apps4.dpi.wi.gov",
                     "origin":"https://apps4.dpi.wi.gov",
                     "referer":"https://apps4.dpi.wi.gov/SchoolDirectory/Search/PublicSchoolsSearch",
                     "X-Requested-With":"XMLHttpRequest"};
        Schools.old_name=Schools.name.replace(/ of .*$/,"");
         Schools.name=Schools.trim_name(Schools.name.replace(/High/,"Hi").replace(/Elementary/,"El").replace(/Middle/,"Mid"))
        .replace(/\([^\)]*\)/,"").trim();
        console.log("Schools.name="+Schools.name);
        var data={"SearchText":Schools.old_name.trim(),"DisplayRegularSchools":true,"CountyId":"","CesaId":"",
                 "DisplayAlternativeSchools":true,
                 "DisplayVocationalSchools":true,
                 "DisplayMagnetSchools":true,
                 "DisplayCharterSchools":true,
                 "DisplaySpecialEdSchools":true,
                  "DisplayPartnershipSchools":true,
                  "DisplayVirtualSchools":true,
                  "Display2RCharterSchools": true
                 };
        var data_str=MTP.json_to_post(data).replace(/%20/g,"+");
        console.log("data_str="+data_str);

        GM_xmlhttpRequest({method: 'POST', url: url,data:data_str,headers:headers,
                           onload: function(response) {
                               console.log("response="+JSON.stringify(response));
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               Schools.WI.parse_school_results(doc,response.finalUrl,resolve,reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    };
    Schools.WI.parse_school_results=function(doc,url,resolve,reject) {
        //        console.log("doc.body.innerHTML="+doc.body.innerHTML);
        var table=doc.getElementById("grid"),i,row,good_link,promise;
        if(table===null) { resolve(""); return; }
        if(table.tagName!=="TABLE") table=table.getElementsByTagName("table")[0];
        // console.log("table.outerHTML="+table.outerHTML);
        for(i=1;i<table.rows.length;i++) {
            console.log("row.cells[0].innerText.trim()="+table.rows[i].cells[0].innerText.trim());
            if((row=table.rows[i]).cells.length>0 && (table.rows.length===2 || Schools.matches_name(row.cells[0].innerText.trim().replace(/Cty /,"County "))) &&
               (good_link=row.cells[0].getElementsByTagName("a")).length>0) break;
        }
        if(!good_link && table.rows.length>=2) good_link=table.rows[1].cells[0].getElementsByTagName("a");
        // console.log("good_link[0].href="+good_link[0].href);
        if(good_link && good_link.length>0) promise=MTP.create_promise(MTP.fix_remote_url(good_link[0].href,url),Schools.WI.parse_school_data,resolve,reject);
    };
    Schools.WI.parse_school_data=function(doc,url,resolve,reject) {
        var table=doc.getElementsByTagName("table"),i,row,curr_contact={},label,text;
        var form_map={"name":/^Contact/,"title":/^Title/,"url":/^Website/,"phone":/^Phone/,"ext":/^Extension/,"email":/^Email/,
                      "address":/^Physical Address/,"mailing_address":/^Mailing Address/,"school_type":/^School Type/},x;
        try {
            for(i=1;i<table[0].rows.length;i++) {
                label=table[0].rows[i].getElementsByClassName("formLabel")[0].innerText.trim();
                text=table[0].rows[i].getElementsByClassName("formText")[0].innerText.trim();
                for(x in form_map) if(form_map[x].test(label)) curr_contact[x]=text;
            }
        }
        catch(error) { console.log("Error parsing table in WI.parse_school_data "+error); }
        if(curr_contact.phone!==undefined && curr_contact.ext!==undefined) curr_contact.phone+=" x"+curr_contact.ext;
        Schools.contact_list.push(curr_contact);
        resolve("");
    };
    Schools.WY.get_state_dir=function(resolve,reject) {
        var url="https://fusion.edu.wyoming.gov/Login/Web/Pages/OnlineDirectory/OnlineDirectorySchoolSearch.aspx";
        var promise=MTP.create_promise(url,Schools.WY.make_state_query,resolve,reject);
    };
    Schools.WY.make_state_query=function(doc,url,resolve,reject) {
        var new_url="https://fusion.edu.wyoming.gov/Login/Web/Pages/OnlineDirectory/OnlineDirectorySchoolSearch.aspx";
        var headers={"host":"fusion.edu.wyoming.gov","origin":"https://fusion.edu.wyoming.gov",
                     "referer":"https://fusion.edu.wyoming.gov/Login/Web/Pages/OnlineDirectory/OnlineDirectorySchoolSearch.aspx",
                     "Content-Type":"application/x-www-form-urlencoded","Upgrade-Insecure-Requests": "1"};
        var data={},data_str,i,inp=doc.getElementsByTagName("input"),sel=doc.getElementsByTagName("select");
        for(i=0;i<inp.length;i++) if(inp[i].type==="text"||inp[i].type==="hidden") data[inp[i].name]=inp[i].value;
        for(i=0;i<sel.length;i++) data[sel[i].name]=sel[i].value;
        data.txtSchoolname=Schools.name;
        data.HidPageCount="1";
        data["ImgSearch.x"]=25;
        data["ImgSearch.y"]=10;
        //data.__EVENTTARGET="dtgPersonExport$ctl02$ctl00";
        data_str=MTP.json_to_post(data).replace(/%20/g,"+");
        //console.log("data="+JSON.stringify(data));
        //console.log("data_str="+data_str);
        GM_xmlhttpRequest({method: 'POST', url: url,headers:headers,data:data_str,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               Schools.WY.make_state_query_get_orgid(doc,response.finalUrl,resolve,reject,response)
                           },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    };
    /* After getting the list we get the org query */
    Schools.WY.make_state_query_get_orgid=function(doc,url,resolve,reject) {

        var new_url="https://fusion.edu.wyoming.gov/Login/Web/Pages/OnlineDirectory/OnlineDirectorySchoolSearch.aspx";
        var headers={"host":"fusion.edu.wyoming.gov","origin":"https://fusion.edu.wyoming.gov",
                     "referer":"https://fusion.edu.wyoming.gov/Login/Web/Pages/OnlineDirectory/OnlineDirectorySchoolSearch.aspx",
                     "Content-Type":"application/x-www-form-urlencoded","Upgrade-Insecure-Requests": "1"};
        var data={},data_str,i,inp=doc.getElementsByTagName("input"),sel=doc.getElementsByTagName("select");
        var table=doc.querySelector(".DataGridStyle"),row,evt_target_num=2;
        if(!table) resolve("");

        for(i=1;i<table.rows.length && i < 9;i++) {
            if((row=table.rows[i]) && row.cells.length>=6 && Schools.matches_name(row.cells[0].innerText.trim()) &&
               (evt_target_num=i+1)) {
                Schools.phone="307-"+row.cells[1].innerText.trim();Schools.street=row.cells[3].innerText.trim();
                Schools.city=row.cells[4].innerText.trim();Schools.state="WY";Schools.zip=row.cells[5].innerText.trim();
                break; }
        }
        for(i=0;i<inp.length;i++) if(inp[i].type==="text"||inp[i].type==="hidden") data[inp[i].name]=inp[i].value;
        for(i=0;i<sel.length;i++) data[sel[i].name]=sel[i].value;
        data.txtSchoolname=Schools.name;
        data.HidPageCount="1";
        data.__EVENTTARGET="dtgPersonExport$ctl0"+(evt_target_num.toString())+"$ctl00";
        data_str=MTP.json_to_post(data).replace(/%20/g,"+");
        GM_xmlhttpRequest({method: 'POST', url: url,headers:headers,data:data_str,
                           onload: function(response) {
                               var match,orgId;
                               if(match=response.finalUrl.match(/orgId\=([\d]+)/)) orgId=match[1];
                               else { resolve(""); return; }
                               //console.log("orgId="+orgId);
                               var url="https://fusion.edu.wyoming.gov/Login/Web/Pages/OnlineDirectory/OnlineDirectoryPersonnelContactList.aspx?orgId="+
                                   orgId+"%20&LevelOneIndex=2%20&LevelTwoIndex=7&LevelThreeIndex=2";
                               var promise=MTP.create_promise(url,Schools.WY.parse_results,resolve,reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    };
    Schools.WY.parse_results=function(doc,url,resolve,reject) {
        var i,table=doc.querySelector(".DataGridStyle"),row,curr_contact={};
        if(!table) resolve("");
        for(i=1; i < table.rows.length;i++) {
            if((row=table.rows[i]) && row.cells.length>=4) {
                Schools.contact_list.push({name:Schools.parse_name_func(row.cells[0].innerText.trim()),email:row.cells[1].innerText.trim(),
                                           title:row.cells[2].innerText.trim(),phone:Schools.phone,street:Schools.street,city:Schools.city,state:Schools.state,
                                           zip:Schools.zip});
            }
        }
        resolve("");
    };
    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurkScript!==undefined && Schools!==undefined && MTP!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    var query_list=[{url:"https://www.bellechasseacademy.org/",query:{type:"school",name:"Berwick High School",title_regex: [/Principal/i],state:"LA"}},{url:"https://www.cpsb.org/",query:{type:"school",name:"High",title_regex: [/Principal/i],state:"LA"}}];
    var query_list2=["https://www.abseconschools.org/"];//https://www.wcpss.net/"];
    function parse_school_then(result) {
        console.log("in parse_school_then");
        var x=Schools.contact_list[0];
        if(x===undefined || x.email.indexOf("@")===-1) {
            console.log("Query failed");
            GM_setValue("returnHit",true);
                           return; }
        console.log("x="+JSON.stringify(x));
        var fullname=MTP.parse_name(x.name.replace(/\s\s+/," "));
        document.getElementById("first_name").value=fullname.fname;
        document.getElementById("last_name").value=fullname.lname;
        document.getElementById("email").value=x.email;
        MTurk.check_and_submit();

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
                console.log("parsed_context="+JSON.stringify(parsed_context)); }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
                {
                    b1_success=true;
                    break;

                }

            }
            if(b1_success)
            {
                /* Do shit */
                resolve(b_url);
                return;
            }
        }
        catch(error)
        {
            reject(error);
            return;
        }
        reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }

    function query_promise_then(result) {
        console.log("query="+JSON.stringify(query));

    };

    /* TODO: need to ensure Secretary to Principal and such are weeded out in query forms */
    function init_Query()
    {
        //var well=document.querySelector(".well");
        //var text=well.innerText.split("\n");
        var text="Kannapolis Charter Academy\n1911 Concord Lake Road\nKannapolis, NC 28083".split("\n");


     //   var text="SOUTH BRONX CLASSICAL CHARTER SCHOOL\n977 FOX ST\nBRONX, NY".split("\n");
        var address=text[1]+","+text[2];
        var search_str;
        var parsed_add=parseAddress.parseLocation(address);
        if(parsed_add===null) parsed_add={};
        if(parsed_add.state===undefined) { parsed_add.city=text[2].split(", ")[0]; parsed_add.state=text[2].split(", ")[1]; }
        var query={name:text[0],
                   city:parsed_add.city,state:parsed_add.state,zip:parsed_add.zip,spreadsheet:true,address:parsed_add};
       query.name=query.name.replace(/-.*$/," ").replace(/ St /i," Street ")
        .replace(/\sChtr([^A-Za-z])/i," Charter$1").trim();

        my_query.query=query;
        console.log("my_query="+JSON.stringify(my_query));
        var promise=Schools.init_Schools(query);
        promise.then(parse_school_then);
    /*    const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(address, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/
        
        

    }

    if(window.location.href.indexOf("trystuff.com")!==-1) begin_script();
})();
