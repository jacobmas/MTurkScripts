// ==UserScript==
// @name         Government
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrapestar Government
// @author       You
// @include http*trystuff.com*
// @include *
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
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    /* Gov.script_loaded is a map of urls to number loaded there, script total is a map of urls to total number needed there */
    var Gov=Gov||{contact_list:[],scripts_loaded:{},scripts_total:{},area_code:"",
                 split_lines_regex:/\s*\n\s*|\s*\t\s*|–|(\s*-\s+)|\||                     |	|	|●|•|\s{3,}|\s+[*≈]+\s+/,id_map:{"ahaconsulting":"municodeweb"},
                 title_regex:new RegExp("(^|[\\s,\\.]{1})(Director|Department|Supervisor|Manager|Clerk|Administrator|Staff|Inspector|Assistant|"+
                                        "Council Member|Attorney|Recorder|Official|Coordinator|Mayor|Planner|Engineer|Police|Fire|&|Specialist|"+
                                        "Superintendent|Marshal|Public|Clerk|Code Enforcement|Building Services|Operations|"+
                                        "Chief)($|[\\/\\n\\s,\\. ]{1}|[^A-Za-z0-9]{1})","i")};
    Gov.bad_out_link_regex=/(\/|\.)(facebook|twitter|youtube)\.com/i;
    Gov.scrapers={"civicplus":Gov.scrape_civicplus,"revize":Gov.scrape_revize,
                 "none":Gov.scrape_none,"visioninternet":Gov.scrape_visioninternet,"municodeweb":Gov.scrape_municodeweb,
                  "infomedia":Gov.scrape_infomedia,"civiclive":Gov.scrape_civiclive,"egovlink":Gov.scrape_egovlink,"govoffice":Gov.scrape_govoffice,
                  "ahaconsulting":Gov.scrape_municodeweb};
    //"govoffice":Gov.scrape_govoffice,
    Gov.muni_regex_str="((City)|(Town)|(Boro(ugh)?)|(County)|(Village)|(Municipal))";
    Gov.manager_regex_str="((Manager)|(Administrator)|(Supervisor))";
    Gov.title_regex_map={"city manager":new RegExp(Gov.muni_regex_str+"\\s+"+Gov.manager_regex_str)};
    //var MTurk=new MTurkScript(20000,200,[],init_Query,"[TODO]");
    function is_bad_name(b_name) {
        return false;
    }
    /* Check if a title matches a department regex */
    Gov.matches_dept_regex=function(title) {
        for(var i=0; i < Gov.query.dept_regex_lst.length; i++) if(title.match(Gov.query.dept_regex_lst[i])) return true;
        return false;
    };
        /* Check if a title matches a person title regex */
    Gov.matches_title_regex=function(title) {
        for(var i=0; i < Gov.query.title_regex_lst.length; i++) if(title.match(Gov.query.title_regex_lst[i])) return true;
        return false;
    };

    /* Gov.scrape_civicplus scrapes the civicplus directory system
       Needs work to allow it to only scrape the directories likely to have the queried contacts, far too slow to scrape them all
    */
    Gov.scrape_civicplus=function(doc,url,resolve,reject) {
        var directory_promise=MTurkScript.prototype.create_promise(url.replace(/\/$/,"")+"/Directory.aspx",
                                                                   Gov.parse_civicplus_directory,resolve,
                                                                  reject); };

    /* Gov.parse_civicplus_directory parses the civicplus_directory page */
    Gov.parse_civicplus_directory=function(doc,url,resolve,reject) {
        var promise_list=[],i;
        console.log("In parse_civicplus_directory");
        if(doc.getElementById("404Content")) { return Gov.parse_civicplus_no_directory(doc,url,resolve,reject); }
        var search_area=doc.getElementById("CityDirectoryLeftMargin") ||doc;
        /* Try based on lack of CityDirectoryLeftMargin */
        var links=search_area.getElementsByTagName("a");
        console.time("contacts");
        for(i=0; i < links.length; i++)
        {
            if(/Directory\.aspx\?did\=/i.test(links[i].href) && Gov.matches_dept_regex(links[i].innerText)||
              /Administration/.test(links[i].innerText)) {
                promise_list.push(MTurkScript.prototype.create_promise(
                    MTurkScript.prototype.fix_remote_url(links[i].href,url),Gov.get_civicplus_contacts,MTurkScript.prototype.my_then_func,
                MTurkScript.prototype.my_catch_func,links[i].innerText)); }
        }
        Promise.all(promise_list).then(
            function(response) {
                console.timeEnd("contacts");
            resolve(response);
            });
    };
    /** TODO: not always table[0] ***/
    Gov.get_civicplus_contacts=function(doc,url,resolve,reject,text) {
        var table,i,j,x,curr_row,title_map,dept={},DirCat,phone_match,tab_area;
        console.log("In Gov.get_civic_plus_contacts for "+text);
        if((DirCat=doc.getElementsByClassName("DirectoryCategoryText")).length>0) {
            dept.name=DirCat[0].innerText.trim();
            if(phone_match=DirCat[0].parentNode.innerText.match(/Phone:\s*([\(\)\s\d\-]+)/)) dept.phone=phone_match[1];
        }
        tab_area=doc.getElementById("CityDirectoryLeftMargin") ? doc.getElementById("CityDirectoryLeftMargin") : doc;
        if((table=tab_area.getElementsByTagName("table")).length>0) {
            for(i=0; i < table[0].rows.length; i++)  {
                if((curr_row=table[0].rows[i]).cells.length>0 &&
                   (!curr_row.cells[0].colSpan || curr_row.cells[0].colSpan===1)) break;
            }

            title_map=Gov.guess_title_map(table[0].rows[i]);
            console.log("title_map="+JSON.stringify(title_map));
            if(!(title_map.name===undefined||title_map.title===undefined)) Gov.parse_table(table[0],title_map,i+1,table[0].rows.length,dept);
        }
        resolve("");
    };
    /* Gov.parse_civicplus_no_directory parses civicplus with no directory.aspx */
    Gov.parse_civicplus_no_directory=function(doc,url,resolve,reject) {
        Gov.scrape_none(doc,url,resolve,reject);
    };
    Gov.scrape_revize=function(doc,url,resolve,reject) {
        var directory_promise=MTurkScript.prototype.create_promise(url.replace(/\/$/,"")+"/staff_directory/index.php",
                                                                   Gov.parse_revize_directory,Gov.parse_revize_directory_then,
                                                                  Gov.parse_revize_no_directory);
    };
    /* parse directory for revize sites */
    Gov.parse_revize_directory=function(doc,url,resolve,reject) {
        console.log("in Gov.parse_revize_directory at "+url);
        var table=doc.getElementsByTagName("table"),title_map;

        if(table.length>0) {
             title_map=Gov.guess_title_map(table[0].rows[0]);
            console.log("title_map="+JSON.stringify(title_map));
            if(!((title_map.name===undefined&&title_map.first===undefined)
                 ||(title_map.title===undefined))) Gov.parse_table(table[0],title_map,1,table[0].rows.length);
        }
        resolve("");
    };
    Gov.parse_revize_directory_then=function(result) {
       if(Gov.contact_list.length===0) { console.log("# No contacts found in revize directory");
                                       var promise=MTurkScript.prototype.create_promise(Gov.url,Gov.scrape_none,Gov.resolve,Gov.reject); }
       else Gov.resolve("");
    };
    Gov.parse_revize_no_directory=function(result) { };
    /* Scrape_govoffice websites */
    Gov.scrape_govoffice=function(doc,url,resolve,reject) {
        var i,promise_list=[];
        console.log("In Gov.scrape_none");
        Gov.get_contact_links(doc,url,resolve,reject);
        for(i=0;i<Gov.contact_links.length;i++) {
            console.log("Gov.contact_links["+i+"]="+Gov.contact_links[i]);
            if(/B_DIR/.test(Gov.contact_links[i])) promise_list.push(MTP.create_promise(Gov.contact_links[i],Gov.parse_govoffice_B_DIR,Gov.parse_contact_then));
        }
        if(promise_list.length>0) Promise.all(promise_list).then(function() { resolve("Done with govoffice"); });
        else Gov.scrape_none(doc,url,resolve,reject);
    };
    Gov.parse_govoffice_B_DIR=function(doc,url,resolve,reject) {
        console.log("Gov.parse_govoffice_B_DIR, url="+url);
        var B_DIR=doc.querySelector(".B_DIR"),vcard=doc.querySelectorAll(".vcard");
        var promise_list=[],i,summaryDisplay=doc.querySelectorAll(".summaryDisplay"),department,a;
        if(!B_DIR && resolve("Failed to find .B_DIR in "+url)) return;
        for(i=0;i<summaryDisplay.length;i++) {
            department=summaryDisplay[i].querySelector(".department");
            a=summaryDisplay[i].querySelector("a");
            console.log("summaryDisplay["+i+"], department="+(department?department.innerText:"")+",a="+(a?a.href:""));
            if(department && a &&
               Gov.matches_dept_regex(department.innerText)) promise_list.push(MTP.create_promise(MTP.fix_remote_url(a.href,url),Gov.parse_govoffice_vcard,MTP.my_then_func));
        }
        Promise.all(promise_list).then(function() { resolve("Done with B_DIR "+url); });
    };
    Gov.parse_govoffice_vcard=function(doc,url,resolve,reject) {
        var vcard=doc.querySelectorAll(".vcard");

        vcard.forEach(function(elem) {
            var email,curr_contact={},x,curr_field,field_lst=elem.querySelectorAll(".field"),i,script;
            var script_regex=/\(\'([^\']*)\',\s*\'([^\']+)\'/,match;
            var fields={"name":".fn","title":".title","department":".department","phone":".tel .value"};
            for(x in fields) if(curr_field=elem.querySelector(fields[x])) curr_contact[x]=curr_field.innerText.trim();
            field_lst.forEach(function(field) {
                if(/Email:/.test(field.innerText) && (script=field.querySelector("script")) &&
                   (match=script.innerHTML.match(script_regex))) curr_contact.email=match[2]+"@"+match[1].replace(/:/g,".");
            });
            if(Gov.matches_title_regex(curr_contact.title)) Gov.contact_list.push(curr_contact);
        });
        resolve("Done vcard at "+url);
    };
    Gov.scrape_visioninternet=function(doc,url,resolve,reject) { };
    Gov.scrape_municodeweb=function(doc,url,resolve,reject) {
        var directory_promise=MTurkScript.prototype.create_promise(url.replace(/\/$/,"")+"/directory",
                                                                   Gov.parse_municodeweb_directory,Gov.parse_municodeweb_directory_then,
                                                                  Gov.parse_municodeweb_no_directory);
    };
    /* parse directory for municodeweb sites TODO: fix if redirecting */
    Gov.parse_municodeweb_directory=function(doc,url,resolve,reject) {
        console.log("in Gov.parse_municodeweb_directory at "+url);
        doc.querySelectorAll(".view-directory-listings .responsive").forEach(Gov.parse_municodeweb_dept);
        doc.querySelectorAll(".view-directory-listings .views-table").forEach(Gov.parse_municodeweb_dept_table);
        if(doc.querySelectorAll(".view-directory-listings .responsive").length===0 &&
           doc.querySelectorAll(".view-directory-listings .views-table").length===0 && doc.title==="404 Not Found")  {
            console.log("doc.head.innerHTML="+doc.head.innerHTML);
        /* <title>404 Not Found</title><meta http-equiv="refresh" content="0;URL=/404-error"> */
        }
        resolve("");
    };
    /* parse individual department for municodeweb sites */
    Gov.parse_municodeweb_dept=function(elem) {
                console.log("In Gov.parse_municodeweb_dept");

        var row=elem.getElementsByClassName("views-row"),dept=elem.getElementsByTagName("h3")[0].innerText.trim(),i,curr_contact={};
        for(i=0;i<row.length; i++) {
            Gov.fix_emails(row[i]);
            curr_contact={name:row[i].querySelector(".views-field-title .field-content").innerText.trim(),
                          title:row[i].querySelector(".views-field-field-position .field-content").innerText.trim(),
                          phone:row[i].querySelector(".views-field-field-phone-number .field-content").innerText.trim(),
                          email:row[i].querySelector(".views-field-field-email .field-content").innerText.trim(),
                          department:dept};
            if(Gov.matches_title_regex(curr_contact.title)) Gov.contact_list.push(curr_contact);
        }
    };
    Gov.parse_municodeweb_dept_table=function(elem) {
        console.log("In Gov.parse_municodeweb_dept_table");
        var row=elem.rows,dept=elem.getElementsByTagName("caption")[0].innerText.trim(),i,curr_contact={};
        for(i=1;i<row.length; i++) {
            curr_contact={name:row[i].querySelector(".views-field-title").innerText.trim(),
                          title:row[i].querySelector(".views-field-field-position").innerText.trim(),
                          phone:row[i].querySelector(".views-field-field-phone-number").innerText.trim(),
                          email:row[i].querySelector(".views-field-field-email").innerText.trim(),
                          department:dept};
            if(Gov.matches_title_regex(curr_contact.title)) Gov.contact_list.push(curr_contact);
        }
    };
    Gov.parse_municodeweb_directory_then=function(result) {
       if(Gov.contact_list.length===0) { console.log("# No contacts found in directory");
                                       var promise=MTurkScript.prototype.create_promise(Gov.url,Gov.scrape_none,Gov.resolve,Gov.reject); }
       else Gov.resolve("");
    };
   Gov.parse_municodeweb_no_directory=function(result) { };

    /** Gov.scrape_none scrapes a generic government website for employees */
    Gov.scrape_none=function(doc,url,resolve,reject) {
        console.log("In Gov.scrape_none");
        Gov.get_contact_links(doc,url,resolve,reject);
        var promise_list=[],i;
        for(i=0; i < Gov.contact_links.length; i++) {
           
            /* First load the scripts and tables into a non-displayed temp_div (there will be several), this should hopefully unhide the emails
               though you may need to load other scripts too, then parse them */
            promise_list.push(MTurkScript.prototype.create_promise(
                Gov.contact_links[i],Gov.load_scripts,Gov.parse_contacts_then));
        }
        for(i=0; i < Gov.dept_links.length; i++)
        {
             //console.log("i="+i+", Gov.dept_links[i]="+Gov.dept_links[i]);
            /* First load the scripts and tables into a non-displayed temp_div (there will be several), this should hopefully unhide the emails
               though you may need to load other scripts too, then parse them */

            promise_list.push(MTurkScript.prototype.create_promise(
                Gov.dept_links[i].url,Gov.parse_department,Gov.parse_contacts_then,MTurkScript.prototype.my_catch_func,Gov.dept_links[i]));
        }
        console.log("scrape_none: promise_list.length="+promise_list.length);
        /* Need to do something here since we're not done fully */
        Promise.all(promise_list).then(function(response) {
            console.log("Finished scrape_none promises "+response);
            resolve("MOOOOOOOOOOOO "+response); });


    };
    /** Gov.parse_department parses a specific department page
     * TODO: a specific page that parses a page listing the departments
    **/
    Gov.parse_department=function(doc,url,resolve,reject,dept) {
        var add_count,name=dept.name;
        console.log("@@@ name="+name);
        console.log("In Gov.parse_department at "+url);
        Gov.get_department_contact_links(doc,url,resolve,reject,name);
        Gov.load_scripts(doc,url,Gov.resolve,Gov.reject,name);
        var external_promise;
        if(Gov.depts[name].external_links.length>0 && !Gov.depts[name].external_parsed) {
            Gov.depts[name].external_parsed=true;
            external_promise=MTurkScript.prototype.create_promise(Gov.depts[name].external_links[0],Gov.parse_department,Gov.parse_contacts_then,MTurkScript.prototype.my_catch_func,name);
        }
        var promise_list=[],i;
        for(i=0; i < Gov.depts[name].contact_links.length; i++)
        {
             console.log("i="+i+", Gov.depts["+name+"].contact_links="+Gov.depts[name].contact_links[i]);
            // First load the scripts and tables into a non-displayed temp_div (there will be several), this should hopefully unhide the emails
              //  though you may need to load other scripts too, then parse them
            promise_list.push(MTurkScript.prototype.create_promise(
                Gov.depts[name].contact_links[i],Gov.load_scripts,Gov.parse_contacts_then,MTurkScript.prototype.my_catch_func,name));
        }
        promise_list.push(external_promise);
        Promise.all(promise_list).then(function(response) { resolve("Done department "+name+" "+(add_count?add_count:"")+", response="+response); });
    };

    /** Gov.load_scripts loads all the tables in a document into a special non-displayed div at the end of the current document  */
    Gov.load_scripts=function(doc,url,resolve,reject,dept_name) {
        if(typeof(dept_name)==="object") { dept_name=""; }
        console.log("load scripts: "+url);
        var scripts_to_load=[],i,j,scripts=doc.getElementsByTagName("script"),curr_script;
        var temp_div=document.createElement("div"),head=document.head;
        temp_div.style.display="none";
        document.body.appendChild(temp_div);
        var tables=doc.querySelectorAll("table");
        for(i=0; i < tables.length; i++)
        {
            let temp_table_scripts=tables[i].getElementsByTagName("script");
            let imgs=tables[i].getElementsByTagName("img"); /* Don't care about images */
            for(j=0;j<imgs.length;j++) imgs[j].src="";
            for(j=0; j < temp_table_scripts.length; j++) {
               // console.log("temp_table_scripts["+j+"]="+temp_table_scripts[j].outerHTML);
                scripts_to_load.push(temp_table_scripts[j]); }
            try {
                temp_div.appendChild(tables[i].cloneNode(true));
            }
            catch(error) { console.log("error appending child table thing="+error); }
        }

        /* Internal function to increment the number of scripts loaded and once all are loaded, parse the tables */
        function increment_scripts()
        {
            if((++Gov.scripts_loaded[url])>=Gov.scripts_total[url]) {
                setTimeout(function() { Gov.parse_contact_tables(doc,url,resolve,reject,temp_div,dept_name); }, 100);
                return true;
            }
            return false;
        }

        Gov.scripts_loaded[url]=0;
        if((Gov.scripts_total[url]=scripts_to_load.length)===0) Gov.parse_contact_tables(doc,url,resolve,reject,temp_div,dept_name);

        console.log("scripts_to_load.length="+scripts_to_load.length);
        for(i=0; i < scripts_to_load.length; i++)
        {
            curr_script=document.createElement("script");
            if(scripts_to_load[i] && (scripts_to_load[i].src===undefined || scripts_to_load[i].src.length===0))
            {
                curr_script.innerHTML=scripts_to_load[i].innerHTML;
                if(increment_scripts()) return true;
            }
            else if(scripts_to_load[i]) curr_script.src=scripts_to_load[i].src;
            else continue;
            curr_script.onload=increment_scripts;
            temp_div.appendChild(curr_script);   
        }
    };

    /* Gov.get_area_code tries to find a (for now US) area code in the page.
     * would probably be better to have as general MTurkScript */
    Gov.get_area_code=function(doc) {
        var area_code_regex=/\((\d{3})(?:\s*area code)?/,area_code_match;
        if(area_code_match=doc.body.innerHTML.match(area_code_regex)) return "("+area_code_match[1]+")";
        else return "";
    };

    /** Gov.parse_contact_tables parses all the contact tables in a temporary div (temp_div) created at the bottom of the page for
     parsing purposes, with all scripts being loaded
     Fix to do if things are in individual divs

     */
    Gov.parse_contact_tables=function(doc,url,resolve,reject,temp_div,dept_name) {
        var i,table=temp_div.querySelectorAll("table");
        var begin_row=0,title_map={},reverse_title_map={},x,add_count=0;
        Gov.area_code=Gov.get_area_code(doc);
        console.log("in parse_contact_tables for "+url);
        for(i=0; i < table.length; i++)
        {
            if(table[i].rows.length>0) title_map=Gov.guess_title_map(table[i].rows[0]);
            if((title_map.name===undefined&&(title_map.first===undefined||title_map.last===undefined))||title_map.title===undefined)
            {
                Gov.add_columns(table[i]);
                /* checks all rows of table here to label */
                if((title_map=Gov.guess_title_map_unlabeled(table[i]))&&
                   (title_map.name===undefined || title_map.title===undefined || title_map.email===undefined)) {
                    console.log("Bad title_map="+JSON.stringify(title_map));
                   console.log(table[i].querySelector("table")!==null);
                    /* May be by individual td */
                    if(!table[i].querySelector("table") && (Gov.fix_emails(table[i])>0)) {
                        table[i].querySelectorAll("td").forEach(function(elem) {
                            var ret,add_count=0;
                            if((ret=Gov.parse_data_func(elem.innerText)) && ret.name && ret.title
                               && ret.email && ++add_count) Gov.contact_list.push(Object.assign(ret,{department:dept_name})); });
                    }
                    continue;
                }
            }
            else begin_row=1;
            console.log("good title_map="+JSON.stringify(title_map));
            add_count=add_count+Gov.parse_table(table[i],title_map,begin_row,table[i].rows.length,dept_name);
        }
        /* No asynchronous calls so won't happen till after tables finish parsing right? */
        if(add_count===0) add_count=Gov.parse_contact_elems(doc,url,resolve,reject,dept_name);
        console.log("url="+url+", add_count="+add_count);

        resolve("Done parse_contact_tables, url="+url+", dept_name="+(dept_name?dept_name:""));
    };
    /**
     * parse individual elements for contacts
     */
    Gov.parse_contact_elems=function(doc,url,resolve,reject,name) {
     console.log("in parse_contact_elems for "+url+", "+name);
        var div=doc.querySelectorAll("div"),i,add_count=0;
        div.forEach(function(elem) { add_count+=Gov.parse_contact_div(elem,name); });
        doc.querySelectorAll("p").forEach(function(inner_p) {
            var ret;
           //  console.log("inner_p.innerText="+inner_p.innerText);
            if(inner_p.querySelector("p")) return;
            Gov.fix_emails(inner_p);
            //console.log("p.innerText="+inner_p.innerText);
            if((ret=Gov.parse_data_func(inner_p.innerText)) && ret.name && ret.title
               && ret.email && ++add_count) Gov.contact_list.push(Object.assign(ret,{department:name}));
        });
        Gov.strip_bad_contacts();
        return add_count;
    };
    /* Process a string for inclusion in a new RegExp(str) type thing */
    function regexpify_str(str) {
        str=str.replace(/\)/g,"\\)").replace(/\(/g,"\\(").replace(/\=/,"\\=").replace(/\*/g,"\\*");
        return str;
    }

    /* Gov.parse_contact_div, will require splitting into multiple contacts */
    Gov.parse_contact_div=function(elem,name) {
       // console.log("elem.outerHTML="+elem.outerHTML);
        var ret,p_adds=0,add_count=0;
        var bolds=elem.querySelectorAll("b,strong"),i,curr_text;
        var text=elem.innerText;
        var split_text=text.split("\n");
        var curr_bold=0,match,curr_regexp;
        if(elem.querySelector("div") && elem.querySelector("div").querySelector("div")) return 0;
        Gov.fix_emails(elem);
       // console.log("text="+text);
        if(bolds.length>1) {
          // console.log("text="+text);
             for(i=0;i<bolds.length; i++) {
                 //console.log("bolds["+i+"]="+bolds[i].innerText);
                 curr_regexp=i<bolds.length-1?new RegExp("("+regexpify_str(bolds[i].innerText.trim())+"[^]*)"+regexpify_str(bolds[i+1].innerText.trim()),"i") :
                 new RegExp("("+regexpify_str(bolds[i].innerText)+"[^]*)","i");
               //  console.log("curr_regexp="+curr_regexp);
                 if((match=text.match(curr_regexp)) && (ret=Gov.parse_data_func(match[1].replace(/\n\n+/g,"\n")))
                    && ret.name && ret.title && ret.email && ++add_count) {
                     console.log("match["+i+"]="+JSON.stringify(match));
                     Gov.contact_list.push(Object.assign(ret,{department:name})); }
             }
        }
        if((add_count===0) && (ret=Gov.parse_data_func(elem.innerText)) && ret.name && ret.title && ret.email
               && ++add_count) Gov.contact_list.push(Object.assign(ret,{department:name}));

        Gov.strip_bad_contacts();
        return add_count;
    };


    /* Strip obviously bad,duplicate contacts */
    Gov.strip_bad_contacts=function() {
        var i,temp_list=[],temp_push;
        for(i=Gov.contact_list.length-1; i>=0; i--) {
            //console.log("Gov.contact_list["+i+"]="+JSON.stringify(Gov.contact_list[i]));
            if(Gov.contact_list[i].department===undefined) Gov.contact_list[i].department="";
            temp_push=Gov.contact_list[i].name+"|"+Gov.contact_list[i].email+"|"+Gov.contact_list[i].department.toString();
            if(Gov.is_bad_contact(Gov.contact_list[i],temp_list,temp_push)) Gov.contact_list.splice(i,1);
            else temp_list.push(temp_push); }
    };
    /* Check for a bad contact */
    Gov.is_bad_contact=function(contact,temp_list,temp_push) {
        var bad_name_regex=/Contact\s+|…|Department|\n/i;
        if(phone_re.test(contact.name) || temp_list.includes(temp_push) ||
              contact.name.length>60 || contact.title.length>60 || bad_name_regex.test(contact.name) || Gov.title_regex.test(contact.name) ||
          contact.name===contact.department) return true;
        return false;
    }


    /**
     * Gov.fix_emails in the sense of replace mailto and such, tries to replace some anti-scrape things too.
     * returns the number of successful replacements
     */
    Gov.fix_emails=function(div,is_civic) {
        var inner_a=div.querySelectorAll("a"),cf_email,result,fix_count=0;
        inner_a.forEach(function(elem) {
            //console.log("elem.innerText="+elem.outerHTML);
            elem.href=elem.href.replace(/^.*\#MAIL:/,"mailto:").replace(/[\(\[]{1}at[\]\)]{1}/,"@").replace(/[\(\[]{1}dot[\]\)]{1}/,".");
            if(/^\s*mailto:\s*/.test(elem.href) && (++fix_count || true)) {
                elem.innerHTML=(!(/Contact|Email/i.test(elem.innerText)||elem.innerText.match(email_re))
                                  ?elem.innerHTML+"\t":"")+elem.href.replace(/^\s*mailto:\s*/,"").replace("%20","")+"\t";
                elem.href="";
            }
            if((cf_email=elem.getElementsByClassName("__cf_email__")).length>0 &&
               cf_email[0].dataset&&cf_email[0].dataset.cfemail) elem.innerHTML=MTurkScript.prototype.cfDecodeEmail(cf_email[0].dataset.cfemail);
        });
        if(is_civic) { fix_count=fix_count+Gov.fix_emails_civic(div); }
        return fix_count;
    };
    /**
     * Special civic decoding
     */
    Gov.fix_emails_civic=function(div) {
        var w_match,x_match,fix_count=0;
        w_match=div.innerText.match(/var\s*w\s*\=\s*\'([^\']+)\'/);
        x_match=div.innerText.match(/var\s*x\s*\=\s*\'([^\']+)\'/);
        if(w_match && x_match &&(++fix_count || true)) div.innerHTML=w_match[1]+"@"+x_match[1];
    };


    /* Gov.parse_table parses a generic table for contacts.
     * table is the table to parse, title_map maps (name,title,phone,email) to column number
     * reverse_title_map maps column number to name,title,phone,email (maybe fix to not need both)
     * it returns the number of contacts added successfully
     * TODO: fix to work with guess_table_map to deal with more complicated tables
     */
    Gov.parse_table=function(table,title_map,begin_row,end_row,dept) {
        console.log("In parse_table");
        var i,j,x,curr_row,curr_contact,inner_a,title,reverse_title_map={};
        var add_count=0,curr_cell;
        for(x in title_map) reverse_title_map[title_map[x]]=x;
        if(begin_row===undefined || begin_row===null) begin_row=1;
        if(end_row===undefined || end_row===null) end_row=table.rows.length;
        if(!dept || !dept.name) dept={};
        for(i=begin_row; i < end_row; i++)  {
            curr_row=table.rows[i];

            if(curr_row.cells.length>0) {
               // console.log("@@ row["+i+"][0]="+curr_row.innerText+", colspan="+curr_row.cells[0].colSpan);
            }
            curr_contact={};
            for(j=0; j < curr_row.cells.length; j++)
            {
                curr_cell=curr_row.cells[j];
                title=reverse_title_map[j];
                if(title==="email" && (Gov.fix_emails(curr_cell)||true)) {// && (inner_a=curr_cell.getElementsByTagName("a")).length>0) {

                    curr_contact[title]=curr_cell.innerText.trim();
                    console.log("veryFirst: curr_contact["+title+"]="+curr_contact.title);
                }
                /*else if(title==="email") {
                    Gov.fix_emails(curr_cell,true);
                    curr_contact[title]=curr_cell.innerText.replace(/\s+\n\s+/g," ").trim().replace(/\n.*$/,"");
                    console.log("curr_contact["+title+"]="+curr_contact.title);
                }*/
                else if(title) curr_contact[title]=curr_cell.innerText.replace(/\s+\n\s+/g," ").trim();
                if(title==="phone" && !curr_contact[title].match(phone_re) &&curr_contact[title].length>0 &&
                   !curr_contact[title].match(Gov.area_code)) curr_contact[title]=Gov.area_code+curr_contact[title].trim();
                if(title==="title") curr_contact[title]=curr_contact[title];
                if(title_map.email===undefined && (inner_a=curr_cell.getElementsByTagName("a")).length>0 &&
                  /^\s*mailto:\s*/.test(inner_a[0].href)) {
                    curr_contact.email=inner_a[0].href.replace(/^\s*mailto:\s*/,"").replace(/\n.*$/,"");
                    }

            }
            if((curr_contact.name||(curr_contact.first&&curr_contact.last))
               && curr_contact.title && (++add_count)) {
                curr_contact.title=curr_contact.title;
                if(!curr_contact.name && curr_contact.first&&
                   curr_contact.last) curr_contact.name=curr_contact.first+" "+curr_contact.last;
                if(dept.name && curr_contact.department===undefined) curr_contact.department=dept.name;
                if(dept.phone && (!curr_contact.phone||curr_contact.phone.length===0)) curr_contact.phone=dept.phone;
                curr_contact.name=Gov.parse_name_func(curr_contact.name);
                if(!curr_contact.email) curr_contact.email="";
                curr_contact.email=curr_contact.email.replace(/\n.*$/g,"").replace(/\n.*$/,"");
                Gov.contact_list.push(curr_contact);
            }
            else if(curr_contact.title) { dept.name=curr_contact.title; };

        }
        Gov.strip_bad_contacts();
        return add_count;
    };

    /* Gov.parse_contacts_then is called after a single contact page is parsed */
    Gov.parse_contacts_then=function(result) {
        var i;
        console.log("Gov.parse_contacts_then: "+result);
        for(i=0; i < Gov.contact_list.length; i++)
        {
            console.log("contact_list["+i+"]="+JSON.stringify(Gov.contact_list[i]));
        }

    };

    /* Gov.guess_title_map tries to map in a simple manner the table columns to data types,
     * name,title,phone,email in particular
     * row is the putative header row.
     * TODO: make suitable for annoying weird-type tables with multiple elements per column */
    Gov.guess_title_map=function(row) {
        var i,curr_cell,ret={};
        for(i=0;i<row.cells.length; i++)
        {
            curr_cell=row.cells[i].innerText.trim();

            if(/(Department|Dept)/i.test(curr_cell)) ret.department=i;
            else if(/First/i.test(curr_cell)) ret.first=i;
            else if(/Last/i.test(curr_cell)) ret.last=i;
            else if(/(Name|Employee)/i.test(curr_cell)) ret.name=i;
            else if(/(Title|Position|Profession)/i.test(curr_cell)) ret.title=i;
            else if(/(Tel|Phone|Number)/i.test(curr_cell)) ret.phone=i;
            else if(/mail/i.test(curr_cell)) ret.email=i;
        }
        if(ret.department!==undefined && ret.title===undefined) ret.title=ret.department;
        return ret;

    };

    /* Gov.parse_name_func is a helper function for parse_data_func */
    Gov.parse_name_func=function(text) {
        var split_str,fname,lname,i;
        var appell=[/^Mr.\s*/,/^Mrs.\s*/,/^Ms.\s*/,/^Miss\s*/,/^Dr.\s*/],suffix=[/,?\s*Jr\.?/];
        for(i=0; i < appell.length; i++) text=text.replace(appell[i],"");
        if(/[a-z]{2,}/.test(text)) {
            text=text.replace(/(,?\s*[A-Z]+)+$/,""); }
        for(i=0; i < suffix.length; i++) text=text.replace(suffix[i],"");
        return text.replace(/^([^,]+),\s*(.*)$/,"$2 $1");
    };
    /**
     * Gov.parse_data_func parses text
     */
    Gov.parse_data_func=function(text) {
        var ret={};
        var fname="",lname="",i=0,j=0, k=0;
        var curr_line, s_part="", second_arr,begin_name;
        var has_pasted_title=false;
        if((text=text.trim()).length===0) return ret;
        var split_lines_1=(text=text.trim()).split(Gov.split_lines_regex),split_lines=[],temp_split_lines,new_split;
        var found_email=false;
        if(/^[^\s]+\s+[^\s]+,\s*[A-Z\.]*[^A-Z\s\n,]+/.test(split_lines_1[0])) {
            split_lines=split_lines_1[0].split(",").concat(split_lines_1.slice(1));
        }
        else split_lines=split_lines_1;
        if(/:/.test(split_lines[0])) split_lines=split_lines[0].split(":").concat(split_lines.slice(1));
        split_lines=split_lines.filter(line => line && line.replace(/[\-\s]+/g,"").trim().length>0);
        /** Additional code **/
        if(Gov.title_regex.test(split_lines[0]) &&
          (temp_split_lines=split_lines.splice(0,1))) split_lines.splice(1,0,temp_split_lines[0]);
        /** End additional code **/

       // console.log("parse_data_func: "+JSON.stringify(split_lines));
        var good_stuff_re=/[A-Za-z0-9]/,bad_stuff_re=/([a-z]{1}[^\s]*\s[a-z]{1}[^\s]*\s[a-z]+)|(^Wh.*\?$)|(\sand\s)|([\d]+)|(I want to\s.*$)|(^Home.*)|(…)/;
        if(split_lines===null) return;
        for(j=0; j < split_lines.length; j++)
        {
            if(split_lines.length>0 && split_lines[j] && split_lines[j].trim().length > 0
               && good_stuff_re.test(split_lines[j]) && !bad_stuff_re.test(split_lines[j])&&
              !(split_lines[j].match(email_re))
              ) break;
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
            ret.name=Gov.parse_name_func(begin_name);
        }
       // console.log("split_lines.length="+split_lines.length);
        for(i=j+1; i < split_lines.length; i++)
        {
         //   found_email=false;
            if(split_lines[i]===undefined || !good_stuff_re.test(split_lines[i])) continue;
          //  console.log("i="+i+", split_lines[i]="+split_lines[i]);
            curr_line=split_lines[i].trim();

            second_arr=curr_line.split(/:\s+/);
            if(/Title:/.test(curr_line) && (ret.title=curr_line.replace(/.*Title:\s*/,"").trim())) continue;
          //  console.log("curr_line="+curr_line+", second_arr.length="+second_arr.length);
            s_part=second_arr[second_arr.length-1].trim();
            //console.log("s_part="+s_part);
            if(email_re.test(s_part) && !found_email &&(found_email=true)) ret.email=s_part.match(email_re)[0];
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

    /* Gov.guess_title_map_unlabeled tries to map in a simple manner the table columns to data types,
     * name,title,phone,email based on form of rows
     * row is the putative header row.
     * TODO: make suitable for annoying weird-type tables with multiple
     * elements per column, maybe by adding add'l column */
    Gov.guess_title_map_unlabeled=function(table) {
        //console.log("in guess_title_map unlabeled "+table.innerText);
        var i=table.rows.length-1,j,curr_cell,ret={},row,inner_a,added_column=false,new_cell;       
        while(i>=0 && ((row=table.rows[i]).cells.length===0 || (row.cells[0].innerText.trim().length===0))) i--;
        if(i<0) return ret;
        for(j=table.rows.length-1;j>=0; j--) {
            row=table.rows[j];ret={};added_column=false;
            for(i=0;i<row.cells.length; i++) {
                curr_cell=row.cells[i].innerText.trim();
                if(email_re.test(curr_cell) ||
                   ((inner_a=row.cells[i].getElementsByTagName("a")).length>0 && /^\s*mailto:\s*/.test(inner_a[0].href))) ret.email=i;
                else if(phone_re.test(curr_cell)) ret.phone=i;
                else if(ret.name===undefined && !(ret.title===undefined && Gov.title_regex.test(curr_cell))) ret.name=i;
                else if(ret.title===undefined) ret.title=i;
             //   else console.log("("+i+"), finding nothing: "+row.cells[i].innerHTML);
            }
            //console.log("unlabeled ret["+j+"]="+JSON.stringify(ret)+", "+row.cells[0].innerText);
            if(ret.title!==undefined&&ret.name!==undefined&&ret.email!==undefined) return ret;
        }
        return ret;
    };
    /* Deals with situation where one column has multiple rows in one */
    Gov.add_columns=function(table) {
        var row,cell,i,j,added_column=false,new_cell;
        for(i=0;i<table.rows.length; i++) {
            row=table.rows[i];
            added_column=false;
            for(j=0;j<row.cells.length; j++) {
                cell=row.cells[j];
                if(cell.innerText.split("\n").length>1 && !added_column) {
                    added_column=true;
                    new_cell=row.insertCell();
                    new_cell.innerHTML=cell.innerText.replace(/^[^\n]+\n/,"");
                    cell.innerHTML=cell.innerHTML.replace(new_cell.innerHTML,"");
                }
            }
        }
    };

    /* Get the contact links for a given department page */
    Gov.get_department_contact_links=function(doc,url,resolve,reject,dept) {
        console.log("dept="+dept);
        Gov.depts[dept]={};
        Gov.depts[dept].contact_links=[];
        Gov.depts[dept].external_links=[];
         var i,j;
        var contact_regex=/Contact|Staff/i,bad_link_regex=/(^\s*(javascript|mailto|tel):)|(\/tag\/)/i;
        var contacthref_regex=/contact/i, bad_contact_regex=/Employee Email/i;;
        var dept_regex=new RegExp(dept,"i");
        var out_str="";
        for(i=0; i < doc.links.length; i++) {
            doc.links[i].href=MTurkScript.prototype.fix_remote_url(doc.links[i].href,url).replace(/^https:/,"http:");;
            if((contact_regex.test(doc.links[i].innerText) || contacthref_regex.test(doc.links[i].href)) &&
               !bad_contact_regex.test(doc.links[i].innerText) &&
               !bad_link_regex.test(doc.links[i].href) && !Gov.contact_links.includes(doc.links[i].href) &&
             !Gov.bad_out_link_regex.test(doc.links[i].href) && !Gov.depts[dept].contact_links.includes(doc.links[i].href)
              ) Gov.depts[dept].contact_links.push(doc.links[i].href);
            if(get_domain_only(url)!==get_domain_only(doc.links[i].href) && !Gov.depts[dept].contact_links.includes(doc.links[i].href) &&
               dept_regex.test(doc.links[i].innerText) && !bad_link_regex.test(doc.links[i].href)) Gov.depts[dept].external_links.push(doc.links[i].href);
        }
    };
    /* Gov.includes_dept checks if a department represented by new_elem={url:url,name:name} is found already in dept_list */
    Gov.includes_dept=function(dept_list,new_elem) {
        for(var i=0;i<dept_list.length;i++) if(new_elem.url===dept_list[i].url) return true;
        return false;
    };


    /*

    Grabs the contact page links from the main page
     Maybe make scraping contact links a generic thing for MTurkScripts ...
     dunno if form thing should be left out
    */
    Gov.get_contact_links=function(doc,url,resolve,reject) {
        var i,j;
        var contact_regex=/Contact|Email|Directory|(^About)|(^Departments)|Staff|Officials|(Town|City) Hall/i,bad_link_regex=/(^\s*(javascript|mailto|tel):)|(\/tag\/)/i;
        var bad_contact_regex=/Employee Email/i;
        var contacthref_regex=/contact/i;
        Gov.contact_links=[];
        var out_str="";
        for(i=0; i < doc.links.length; i++) {
            doc.links[i].href=MTurkScript.prototype.fix_remote_url(doc.links[i].href,url).replace(/^https:/,"http:");
            out_str=doc.links[i].href+", "+doc.links[i].innerText+": ";
            if((contact_regex.test(doc.links[i].innerText) || contacthref_regex.test(doc.links[i].href)) &&
               !bad_contact_regex.test(doc.links[i].innerText)&&
               !bad_link_regex.test(doc.links[i].href) && !Gov.contact_links.includes(doc.links[i].href.toString()) &&
             !Gov.bad_out_link_regex.test(doc.links[i].href)
              ) Gov.contact_links.push(doc.links[i].href.toString());
            if(Gov.matches_dept_regex(doc.links[i].innerText) && !Gov.bad_out_link_regex.test(doc.links[i].href) &&
                  !Gov.includes_dept(Gov.dept_links,{url:doc.links[i].href,name:doc.links[i].innerText}) && !bad_link_regex.test(doc.links[i].href) &&
               (out_str=out_str+" matched dept_links")) Gov.dept_links.push({url:doc.links[i].href,name:doc.links[i].innerText});
          //  if(/matched/.test(out_str)) console.log("out_str["+i+"]="+out_str);

        }
        console.log("Gov.dept_links="+JSON.stringify(Gov.dept_links));
        Gov.contact_links.forEach(function(elem) {
            console.log("("+elem+")"); });

    };

    var emailProtector=emailProtector||{};
    emailProtector.addCloakedMailto=function(g,l){
        var h=document.querySelectorAll("."+g),i;
        for(i=0;i<h.length;i++){
            var b=h[i],k=b.getElementsByTagName("span"),e="",c="";
            b.className=b.className.replace(" "+g,"");
            for(var f=0;f<k.length;f++) {
                for(var d=k[f].attributes,a=0;a<d.length;a++) {
                    0===d[a].nodeName.toLowerCase().indexOf("data-ep-acd80")&&(e+=d[a].value),
                        0===d[a].nodeName.toLowerCase().indexOf("data-ep-bc962")&&(c=d[a].value+c); }
            }
            if(!c) break;
            b.innerHTML=e+c;
            if(!l )break;
            b.parentNode.href="mailto:"+e+c
        }
    };

  
    /**  Gov.identify_site works with the MTurkScript.prototype.create_promise format to
     * identify the "type" of municipal govt website, then resolves and does the callback
     * of govt website */
    Gov.identify_site=function(doc,url,resolve,reject) {
        console.time("id_promise");
        Gov.home=doc;
        Gov.home_url=url;
        Gov.id_resolve=resolve;
        Gov.id_reject=reject;
        Gov.id_from_links(doc,url,resolve,reject,0);
    };

    /**
     * Gov.id_from_links searches to a level/depth of 1 to find links that identify the Content Management System
     * powering the site to enable how to best do scrapes
     *  */
    Gov.identify_site=function(doc,url,resolve,reject) {
        var i,links=doc.links,scripts=doc.scripts;
        var follow_lst=[],promise_lst=[],gov_match,id;
        console.log("url="+url);
        for(i=0; i < links.length; i++) {
            if(gov_match=links[i].href.match(Gov.id_regex)) return gov_match[0].replace(/\.[^\.]*$/,"").replace(/^(\.|\/)/,"");
            else if(/municodeweb/i.test(links[i].innerText)) return "municodeweb";
        }
        for(i=0;i<scripts.length;i++) {
            if(/^\s*var _paq/.test(scripts[i].innerHTML) &&
               (gov_match=scripts[i].innerHTML.match(Gov.id_regex))) return gov_match[0].replace(/\.[^\.]*$/,"").replace(/^(\.|\/)/,"");
            if(scripts[i].src && (gov_match=scripts[i].src.match(Gov.id_regex))) return gov_match[0].replace(/\.[^\.]*$/,"").replace(/^(\.|\/)/,"");
        }
        return "none";


    };
    /* Gov.gov_id_promise_then following resolving the type of site. It then calls the scraper for that type of site
     * (TODO) lots
    */
   



    /* initialize the regex for iding site types */
    Gov.init_id_regex=function() {
        var id_regex_str="";
        for(var x in Gov.scrapers) {
            if(x!=="none") {
                if(id_regex_str.length>0) id_regex_str=id_regex_str+"|";
                id_regex_str=id_regex_str+"(\/|\\.)"+x+"\\.com"; }
        }
        Gov.id_regex=new RegExp(id_regex_str);
    };

    /** Gov.init_Gov will initialize government search being given a url (string) and a query (object)
     *
     * query:{dept_regex_lst:array,title_regex_lst:array} for now querytype should always be search, dept_regex_lst
     * should be a list of regular expressions that correspond to good either department or title
     */
    Gov.init_Gov=function(doc,url,resolve,reject,query)
    {
        Gov.url=url;Gov.query=query;Gov.dept_links=[];Gov.resolve=resolve;Gov.reject=reject;
        Gov.init_id_regex();Gov.depts={};
        Gov.promise_list=[];
        console.log("Gov.id_regex="+Gov.id_regex);
        Gov.id=Gov.identify_site(doc,url,resolve,reject);
        if(Gov.id_map[Gov.id]) Gov.id=Gov.id_map[Gov.id];
        console.log("Gov.id="+Gov.id);
        Gov["scrape_"+Gov.id](doc,url,resolve,reject);

    }

    var parse_contacts_then=function(result) {
        var i;
        console.log("### parse_contacts_then: "+result);
        for(i=0; i < Gov.contact_list.length; i++)
        {
            console.log("contact_list["+i+"]="+JSON.stringify(Gov.contact_list[i]));
        }

    };

    function do_colorado(doc,url,resolve,reject) {
        var regex_lst=[new RegExp("^\\s*(Park|Rec|Public Works|Community Service|Administration)","i")];

        var query={"dept_regex_lst":regex_lst,"title_regex_lst":[/.*/i]};
        var a=doc.querySelectorAll("table a"),i,query_list=[];
        for(i=0;i<a.length;i++) {
           // console.log("a="+a[i].outerHTML);
            query_list.push({url:a[i].href,name:a[i].innerText});
        }
        var num=126;
        console.log("querying on "+query_list[num].name+", "+query_list[num].url);
        var promise=new MTurkScript.prototype.create_promise(query_list[num].url,
                                                             Gov.init_Gov,parse_contacts_then,MTurkScript.prototype.my_catch_func,query);

    }


    function init_Query()
    {
        my_query={};
        var i;
        //console.log("is_bad_url for "+window.location.href+" = "+MTurkScript.prototype.is_bad_url(window.location.href,[],3));
        if(/facebook\.com/.test(window.location.href) || MTurkScript.prototype.is_bad_url(window.location.href,[],3)) return;
        var regex_lst=[new RegExp("^\\s*(Park|Rec|Public Works|Finance|Community Service|Administration|Administrator)","i")];
      
        var query={"dept_regex_lst":regex_lst,"title_regex_lst":[/.*/i]};
        if(window.location.href.indexOf("trystuff.com")!==-1) {
            var promise=MTurkScript.prototype.create_promise("https://www.cml.org/cml-member-directory/",do_colorado,MTurkScript.prototype.my_then_func); }

/*        var promise=new MTurkScript.prototype.create_promise(window.location.href,
                                                             Gov.init_Gov,parse_contacts_then,MTurkScript.prototype.my_catch_func,query);*/
        

     /*   var my_promise=new Promise((resolve,reject) => {

            Gov.identify_site(document,window.location.href,resolve,reject);
        });*/
    }

    init_Query();

})();