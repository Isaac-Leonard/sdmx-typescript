/*
    This file is part of sdmx-js.

    sdmx-js is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    sdmx-js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with sdmx-js.  If not, see <http://www.gnu.org/licenses/>.
    Copyright (C) 2016 James Gardner
*/
//import { Promise } from 'bluebird';

import * as interfaces from '../sdmx/interfaces';
import * as registry from '../sdmx/registry';
import * as structure from '../sdmx/structure';
import * as message from '../sdmx/message';
import * as commonreferences from '../sdmx/commonreferences';
import * as common from '../sdmx/common';
import * as data from '../sdmx/data';
import * as parser from '../sdmx/parser';
export class ILO implements interfaces.Queryable, interfaces.RemoteRegistry, interfaces.Repository {
  private agency: string = 'ILO';
  //http://stats.oecd.org/restsdmx/sdmx.ashx/GetDataStructure/ALL/OECD
  private serviceURL: string = 'http://cors-anywhere.herokuapp.com/http://www.ilo.org/ilostat/sdmx/ws/rest';
  //private serviceURL: string = "http://stat.abs.gov.au/restsdmx/sdmx.ashx/";
  private options: string = '';
  private local: interfaces.LocalRegistry = new registry.LocalRegistry();

  private dataflowList: Array<structure.Dataflow> = null;
  private classifications: structure.Codelist = null;
  private indicatorsArrayCodelist: Array<structure.Codelist> = [];
  getDataService(): string {
    return 'ILO';
  }
  getRemoteRegistry(): interfaces.RemoteRegistry {
    return this;
  }

  getRepository(): interfaces.Repository {
    return this; //this;
  }

  clear() {
    this.local.clear();
  }
  query(q: data.Query): Promise<message.DataMessage> {
    var url =
      this.serviceURL +
      '/data/' +
      q.getDataflow().getId().toString() +
      '/' +
      q.getQueryString() +
      '/all?startPeriod=' +
      q.getStartDate().getFullYear() +
      '&endPeriod=' +
      q.getEndDate().getFullYear();
    return this.retrieveData(q.getDataflow(), url);
  }
  public async retrieveData(dataflow: structure.Dataflow, urlString: string): Promise<message.DataMessage> {
    console.log('ilo retrieveData:' + urlString);
    var s: string = this.options;
    if (urlString.indexOf('?') == -1) {
      s = '?' + s + '&random=' + new Date().getTime();
    } else {
      s = '&' + s + '&random=' + new Date().getTime();
    }
    var opts: any = {};
    opts.url = urlString;
    opts.method = 'GET';
    opts.headers = { Origin: document.location };
    return this.makeRequest(opts).then(function (a) {
      console.log('Got Data Response');
      var dm = parser.SdmxParser.parseData(a);
      var payload = new common.PayloadStructureType();
      payload.setStructure(dataflow.getStructure());
      dm.getHeader().setStructures([payload]);
      return dm;
    });
  }
  constructor(agency: string, service: string, options: string) {
    if (service != null) {
      this.serviceURL = service;
    }
    if (agency != null) {
      this.agency = agency;
    }
    if (options != null) {
      this.options = options;
    }
  }

  load(struct: message.StructureType) {
    console.log('abs load');
    this.local.load(struct);
  }

  unload(struct: message.StructureType) {
    this.local.unload(struct);
  }
  makeRequest(opts: interfaces.RequestOptions): Promise<string> {
    return new Promise<string>(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(opts.method, opts.url);
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: xhr.status,
            statusText: xhr.statusText,
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: xhr.status,
          statusText: xhr.statusText,
        });
      };
      if (opts.headers) {
        Object.keys(opts.headers).forEach(function (key) {
          xhr.setRequestHeader(key, opts.headers[key]);
        });
      }
      xhr.send(opts.params);
    });
  }
  public async retrieve(urlString: string): Promise<message.StructureType> {
    console.log('nomis retrieve:' + urlString);
    var s: string = this.options;
    if (urlString.indexOf('?') == -1) {
      s = '?' + s + '&random=' + new Date().getTime();
    } else {
      s = '&' + s + '&random=' + new Date().getTime();
    }
    var opts: any = {};
    opts.url = urlString;
    opts.method = 'GET';
    opts.headers = { Origin: document.location };
    return this.makeRequest(opts).then(function (a) {
      return parser.SdmxParser.parseStructure(a);
    });
  }
  public async retrieve2(urlString: string): Promise<string> {
    console.log('nomis retrieve:' + urlString);
    var s: string = this.options;
    if (urlString.indexOf('?') == -1) {
      s = '?' + s + '&random=' + new Date().getTime();
    } else {
      s = '&' + s + '&random=' + new Date().getTime();
    }
    var opts: any = {};
    opts.url = urlString;
    opts.method = 'GET';
    opts.headers = { Origin: document.location };
    return this.makeRequest(opts).then(function (a) {
      return a;
    });
  }

  public async findDataStructure(ref: commonreferences.Reference): Promise<structure.DataStructure> {
    var dst: structure.DataStructure = this.local.findDataStructure(ref);
    if (dst != null) {
      return dst;
    } else {
      return <Promise<structure.DataStructure>>this.retrieve(
        this.getServiceURL() +
          '/datastructure/' +
          ref.getAgencyId().toString() +
          '/' +
          ref.getMaintainableParentId().toString() +
          '?references=children',
      ).then(
        function (structure: message.StructureType) {
          this.local.load(structure);
          return structure.getStructures().findDataStructure(ref);
        }.bind(this),
      );
    }
  }

  public async listDataflows(): Promise<structure.Dataflow[]> {
    if (this.dataflowList != null) {
      return this.dataflowList;
    } else {
      const r: commonreferences.Ref = new commonreferences.Ref();
      r.setAgencyId(new commonreferences.NestedNCNameID(this.agency));
      r.setMaintainableParentId(new commonreferences.ID('CL_COLLECTION'));
      r.setVersion(null);
      const ref: commonreferences.Reference = new commonreferences.Reference(r, null);
      this.classifications = await this.findCodelist(ref);
      var indicatorsArray = this.classifications.getItems().map((code) => {
        var cod: string = code.getId().toString();
        var r2: commonreferences.Ref = new commonreferences.Ref();
        r2.setAgencyId(new commonreferences.NestedNCNameID(this.agency));
        r2.setMaintainableParentId(new commonreferences.ID('CL_INDICATOR_' + cod));
        r2.setVersion(null);
        return new commonreferences.Reference(r2, null);
      });

      this.indicatorsArrayCodelist = await Promise.all(indicatorsArray.map((item) => this.findCodelist(item)));
      console.log(JSON.stringify(indicatorsArray));
      this.dataflowList = this.classifications
        .getItems()
        .map((col1, i) => {
          var con = col1.getId().toString();
          const indicator = this.indicatorsArrayCodelist[i];
          return indicator.getItems().map((indic) => {
            const dataflow = new structure.Dataflow();
            dataflow.setAgencyId(this.classifications.getAgencyId());
            const indicid = indic.getId().toString();
            dataflow.setId(new commonreferences.ID('DF_' + con + '_ALL_' + indicid));
            dataflow.setVersion(null);
            const r3: commonreferences.Ref = new commonreferences.Ref();
            r3.setAgencyId(this.classifications.getAgencyId());
            r3.setMaintainableParentId(new commonreferences.ID(con + '_ALL_' + indicid));
            r3.setVersion(null);
            const langs = ['en', 'fr', 'es'];
            const names = langs.map(
              (lang) => new common.Name(lang, `${col1.findName(lang).getText()} - ${indic.findName(lang).getText()}`),
            );
            dataflow.setNames(names);
            const reference: commonreferences.Reference = new commonreferences.Reference(r3, null);
            dataflow.setStructure(reference);
            return dataflow;
          });
        })
        .flat();
      return this.dataflowList;
    }
  }
  public getServiceURL(): string {
    return this.serviceURL;
  }
  findDataflow(ref: commonreferences.Reference): Promise<structure.Dataflow> {
    return null;
  }
  findCode(ref: commonreferences.Reference): Promise<structure.CodeType> {
    return null;
  }
  async findCodelist(ref: commonreferences.Reference): Promise<structure.Codelist> {
    var dst: structure.Codelist = this.local.findCodelist(ref);
    if (dst != null) {
      return dst;
    } else {
      return <Promise<structure.Codelist>>this.retrieve(
        this.getServiceURL() +
          '/codelist/' +
          ref.getAgencyId().toString() +
          '/' +
          ref.getMaintainableParentId() +
          (ref.getVersion() == null ? '/latest' : ref.getVersion().toString()),
      ).then(
        function (structure: message.StructureType) {
          this.local.load(structure);
          var cl: structure.Codelist = structure.getStructures().findCodelist(ref);
          return cl;
        }.bind(this),
      );
    }
  }
  findItemType(item: commonreferences.Reference): Promise<structure.ItemType> {
    return null;
  }
  findConcept(ref: commonreferences.Reference): Promise<structure.ConceptType> {
    return null;
  }
  async findConceptScheme(ref: commonreferences.Reference): Promise<structure.ConceptSchemeType> {
    var dst: structure.ConceptSchemeType = this.local.findConceptScheme(ref);
    if (dst != null) {
      return dst;
    } else {
      return <Promise<structure.ConceptSchemeType>>this.retrieve(
        this.getServiceURL() +
          '/conceptscheme/' +
          ref.getAgencyId().toString() +
          '/' +
          ref.getMaintainableParentId() +
          (ref.getVersion() == null ? '/latest' : ref.getVersion().toString()),
      ).then(
        function (structure: message.StructureType) {
          this.local.load(structure);
          return structure.getStructures().findConceptScheme(ref);
        }.bind(this),
      );
    }
  }
  searchDataStructure(ref: commonreferences.Reference): Promise<Array<structure.DataStructure>> {
    return null;
  }
  searchDataflow(ref: commonreferences.Reference): Promise<Array<structure.Dataflow>> {
    return null;
  }
  searchCodelist(ref: commonreferences.Reference): Promise<Array<structure.Codelist>> {
    return null;
  }
  searchItemType(item: commonreferences.Reference): Promise<Array<structure.ItemType>> {
    return null;
  }
  searchConcept(ref: commonreferences.Reference): Promise<Array<structure.ConceptType>> {
    return null;
  }
  searchConceptScheme(ref: commonreferences.Reference): Promise<Array<structure.ConceptSchemeType>> {
    return null;
  }
  getLocalRegistry(): interfaces.LocalRegistry {
    return this.local;
  }
  save(): any {}
}
export default { ILO: ILO };
