// ==UserScript==
// @name         slblue
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Safety Data Sheets highly incomplete
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
// @require https://cdn.jsdelivr.net/npm/pdfjs-dist@2.0.943/build/pdf.min.js
// Wrequire https://cdn.jsdelivr.net/npm/pdfjs-dist@2.0.943/build/pdf.worker.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A7I7X3YFM784C");
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined && pdfjsLib!==undefined) { callback(); }
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
        for(x in my_query.done) if(!done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    function parse_pdf(pdf) {
        console.log("pdf="+JSON.stringify(pdf));
    }
    function paste_hazards(e) {
        e.preventDefault();
        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");
        text=text;//.replace(/^Section\s*/g,"");
        var is_section=false;
        if(/Section 1\./.test(text)) is_section=true;
        var sections=[], text_split=text.split("\n"),curr_section="",i;
        for(i=0;i<text_split.length;i++) {
            if(curr_section.length>0 && ((is_section && /^(Section\s*)[\d]+\./.test(text_split[i]))||
                                        (!is_section && /^[\d]+\./.test(text_split[i])
                                        ))) {
                sections.push(curr_section);
                curr_section="";
            }
            curr_section=curr_section+text_split[i]+"\n";
        }
        if(curr_section.length>0) {
                sections.push(curr_section);
                curr_section="";
        }
        console.log("sections[0]="+sections[0]);
        var my_date=sections[0].match(/([\d]{2})\/([\d]{2})\/([\d]{4})/);
        document.getElementById("effective_date").type="text";
        if(my_date) my_query.fields.effective_date=my_date[3]+"-"+my_date[1]+"-"+my_date[2];
        add_to_sheet();
        my_query.fields.has_nfpa=my_query.fields.has_hmis=my_query.fields.bad_sections=0;
        my_query.fields.nfpa_health=my_query.fields.nfpa_flam=my_query.fields.nfpa_react=my_query.fields.nfpa_special="UNKNOWN";
        my_query.fields.hmis_health=my_query.fields.hmis_flam=my_query.fields.hmis_phys=my_query.fields.hmis_ppe="UNKNOWN";

        for(i=1;i<sections.length;i++) {
            console.log("sections["+i+"]="+sections[i]);
            parse_section(sections[i]);
        }


    }

    function parse_section(text) {
        var sec_num;
        try {
            sec_num=text.match(/^[\d]+/)[0];
            if(sec_num==="1") { parse_sec1(text); }
            if(sec_num==="2") { parse_sec2(text); }
            if(sec_num==="15") { parse_sec16(text); }
            if(sec_num==="16") { parse_sec16(text); }
        }
        catch(error) { console.log("error "+error); }
    }
    function parse_sec1(text) {
        var prod_name_reg=/(?:(?:Product[^:]*:)|(?:Product Name))\s*(.*)/i;
        var emerg_phone_reg=/(?:(?:Emergency[^:]*(?:Contact|Phone|Number))|Emergencia)[^:]*:\s*(.*)/i;

        var text_split=text.split("\n");
        var add_text="",i,j;
        var match;
        if(match=text.match(prod_name_reg)) my_query.fields.name=match[1].trim();
        if(match=text.match(emerg_phone_reg)) my_query.fields.mfr_phone=match[1].trim();
        else if(match=text.match(phone_re)) my_query.fields.mfr_phone=match[0].trim();
        for(i=0;i<text_split.length;i++) {
            if(/COMPANY|COMPAÑÍA/i.test(text_split[i])) {
                break;
            }
        }
        if(/COMPANY|COMPAÑÍA/i.test(text_split[i]) && i +1 < text_split.length) {
            if(!/Información del Producto/.test(text_split[i+1])) {
                my_query.fields.mfr_name=text_split[i+1].trim(); }
            else if(match=text.match(/(?:Company|Compañía)[^:]*:\s*(.*)/)) my_query.fields.mfr_name=match[1];
        }
        match=null;
        for(j=i+2;j<text_split.length; j++) {
            if((match=text_split[j].match(/^(.*) ([A-Z]{2}) ([\d-]{5,})/))) {
                break;
            }
        }
        if(match && j<text_split.length) {
            my_query.fields.mfr_street_address=text_split[j-1].trim();
            my_query.fields.mfr_city=match[1].trim();
            my_query.fields.mfr_state_code=match[2].trim();
            my_query.fields.mfr_zip_code=match[3].trim();
        }
        add_to_sheet();


    }
    function parse_sec2(text) {
        var signal=/Signal[^:]*:\s*([A-Za-z]*)/,match,i,j;
        var text_split=text.split("\n"),haz_data="",begin_paste=false,pre_data="";
        if(match=text.match(signal)) {
            if(/Warning/i.test(match[1])) my_query.fields.signal_word="Warning";
            else if(/Danger/i.test(match[1])) my_query.fields.signal_word="Danger";
            else {
                console.log("Signal word="+match[1]);

                my_query.fields.signal_word="other";
            }
        }
        else my_query.fields.signal_word="None";
        for(i=1;i<text_split.length;i++) {
            if(begin_paste && text_split[i].trim().length>0) haz_data+=text_split[i]+"\n";
            else if(begin_paste) break;
            else if(/Hazards/i.test(text_split[i])) begin_paste=true;
        }
        my_query.fields.haz_statements=haz_data;
        begin_paste=false;
        for(i=1;i<text_split.length;i++) {
            if(begin_paste && text_split[i].trim().length>0) pre_data+=text_split[i]+"\n";
            else if(begin_paste) break;
            else if(/Precaution/i.test(text_split[i])) begin_paste=true;
        }
        my_query.fields.precaution_statements=pre_data;
        console.log("my_query="+JSON.stringify(my_query));
        add_to_sheet();


    }

    function parse_sec16(text) {
        console.log("*** in Section 16");
        var signal=/Signal[^:]*:\s*([A-Za-z]*)/,match,i,j,my_split;
        var text_split=text.split("\n"),haz_data="",begin_paste=false,pre_data="";
        var my_list;
        var hmis_map="Health";

        my_query.fields.haz_statements=haz_data;
        begin_paste=false;
        for(i=1;i<text_split.length;i++) {
            if(/NFPA/.test(text_split[i]))
            {
                my_query.fields.has_nfpa=1;
                break;
            }
        }
        if(/Health.*Flammability.*Instability/.test(text_split[i+1]))
        {
            my_split=text_split[i+2].split(" ");
            my_query.fields.nfpa_health=my_split[0];
            my_query.fields.nfpa_flam=my_split[1];
            my_query.fields.nfpa_react=my_split[2];
        }
        else if(/(Health|Salud).*[\d]+/.test(text_split[i+1])) {
            for(i=i+1;i<text_split.length;i++) {
                if(match=text_split[i].match(/(?:Health|Salud).*([\d]+)/)) my_query.fields.nfpa_health=match[1];
                if(match=text_split[i].match(/(?:Fueg|Flam|Inflam).*([\d]+)/)) my_query.fields.nfpa_flam=match[1];
                if(match=text_split[i].match(/(?:React).*([\d]+)/)) my_query.fields.nfpa_react=match[1];
                  if(match=text_split[i].match(/(?:Special|Especial).*([\d]+)/)) my_query.fields.nfpa_special=match[1];
                if(/HMIS/.test(text_split[i])) break;
            }
        }
        for(i=1;i<text_split.length;i++) {
            if(/HMIS/.test(text_split[i]))
            {
                my_query.fields.has_hmis=1;
                break;
            }
        }
        if(/Health.*Flamm.*/.test(text_split[i+1]))
        {
            my_list=text_split[i+1].split(" ");
             my_split=text_split[i+2].split(" ");
            my_query.fields.nfpa_health=my_split[0];
            my_query.fields.nfpa_flam=my_split[1];
            my_query.fields.nfpa_react=my_split[2];
        }
        else if(/(Health|Salud).*[\d]+/.test(text_split[i+1])) {
            for(i=i+1;i<text_split.length;i++) {
                if(match=text_split[i].match(/(?:Health|Salud).*([\d]+)/)) my_query.fields.hmis_health=match[1];
                if(match=text_split[i].match(/(?:Flam|Inflam).*([\d]+)/)) my_query.fields.hmis_flam=match[1];
                if(match=text_split[i].match(/(?:React).*([\d]+)/)) my_query.fields.hmis_phys=match[1];
                  if(match=text_split[i].match(/(?:Special|Especial).*([\d]+)/)) my_query.fields.hmis_ppe=match[1];
                if(/NFPA/.test(text_split[i])) break;
            }
        }


      //  console.log("my_query="+JSON.stringify(my_query));
        add_to_sheet();


    }





    function init_Query()
    {
        console.log("in init_query");
        var i;
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        var wrapper=document.getElementById("doc-wrapper");
        my_query={url:wrapper.src,fields:{},done:{},submitted:false};
       // pdfjsLib.GlobalWorkerOptions.workerSrc ="https://cdn.jsdelivr.net/npm/pdfjs-dist@2.0.943/build/pdf.worker.min.js";
       // pdfjsLib.getDocument(my_query.url).then(parse_pdf);
        document.getElementById("name").addEventListener("paste",paste_hazards);

       
    }

})();