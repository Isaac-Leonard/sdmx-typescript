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
import * as collections from 'typescript-collections';
import * as commonreferences from '../sdmx/commonreferences';
import * as interfaces from '../sdmx/interfaces';
import * as message from '../sdmx/message';
import * as structure from '../sdmx/structure';
export class LocalRegistry implements interfaces.LocalRegistry {
  private structures: Array<message.StructureType> = [];
  // Registry
  listDataflows(): Array<structure.Dataflow> {
    var dataflowList: Array<structure.Dataflow> = [];
    for (var i = 0; i < this.structures.length; i++) {
      for (var j = 0; j < this.structures[i].listDataflows().length; j++) {
        dataflowList.push(this.structures[i].listDataflows()[j]);
      }
    }
    return dataflowList;
  }
  clear(): void {
    this.structures = [];
  }
  load(struct: message.StructureType): void {
    if (struct != null) {
      this.structures.push(struct);
    }
  }
  unload(struct: message.StructureType): void {
    collections.arrays.remove(this.structures, struct);
  }
  findDataStructure(ref: commonreferences.Reference): structure.DataStructure {
    for (var i: number = 0; i < this.structures.length; i++) {
      if (this.structures[i].findDataStructure(ref) != null) {
        return this.structures[i].findDataStructure(ref);
      }
    }
    return null;
  }
  findDataflow(ref: commonreferences.Reference): structure.Dataflow {
    return null;
  }
  findCode(ref: commonreferences.Reference): structure.CodeType {
    return null;
  }
  findCodelist(ref: commonreferences.Reference): structure.Codelist {
    for (var i: number = 0; i < this.structures.length; i++) {
      if (this.structures[i].findCodelist(ref) != null) {
        return this.structures[i].findCodelist(ref);
      }
    }
    return null;
  }
  findItemType(item: commonreferences.Reference): structure.ItemType {
    return null;
  }
  findConcept(ref: commonreferences.Reference): structure.ConceptType {
    for (var i: number = 0; i < this.structures.length; i++) {
      if (this.structures[i].findConcept(ref) != null) {
        return this.structures[i].findConcept(ref);
      }
    }
    return null;
  }
  findConceptScheme(ref: commonreferences.Reference): structure.ConceptSchemeType {
    for (var i: number = 0; i < this.structures.length; i++) {
      if (this.structures[i].findConceptScheme(ref) != null) {
        return this.structures[i].findConceptScheme(ref);
      }
    }
    return null;
  }
  searchDataStructure(ref: commonreferences.Reference): Array<structure.DataStructure> {
    return null;
  }
  searchDataflow(ref: commonreferences.Reference): Array<structure.Dataflow> {
    return null;
  }
  searchCodelist(ref: commonreferences.Reference): Array<structure.Codelist> {
    return null;
  }
  searchItemType(item: commonreferences.Reference): Array<structure.ItemType> {
    return null;
  }
  searchConcept(ref: commonreferences.Reference): Array<structure.ConceptType> {
    return null;
  }
  searchConceptScheme(ref: commonreferences.Reference): Array<structure.ConceptSchemeType> {
    return null;
  }
  save(): any {}
}
export class DoubleRegistry implements interfaces.LocalRegistry {
  private left: interfaces.LocalRegistry = null;
  private right: interfaces.LocalRegistry = null;
  constructor(left: interfaces.LocalRegistry, right: interfaces.LocalRegistry) {
    this.left = left;
    this.right = right;
  }
  // Registry
  listDataflows(): Array<structure.Dataflow> {
    var dataflowList: Array<structure.Dataflow> = [];
    collections.arrays.forEach(this.left.listDataflows(), function (a) {
      dataflowList.push(a);
    });
    collections.arrays.forEach(this.right.listDataflows(), function (a) {
      dataflowList.push(a);
    });
    return dataflowList;
  }
  clear(): void {}
  load(struct: message.StructureType): void {}
  unload(struct: message.StructureType): void {}
  findDataStructure(ref: commonreferences.Reference): structure.DataStructure {
    if (this.left.findDataStructure(ref) != null) {
      return this.left.findDataStructure(ref);
    } else {
      return this.right.findDataStructure(ref);
    }
  }
  findDataflow(ref: commonreferences.Reference): structure.Dataflow {
    if (this.left.findDataflow(ref) != null) {
      return this.left.findDataflow(ref);
    } else {
      return this.right.findDataflow(ref);
    }
  }
  findCode(ref: commonreferences.Reference): structure.CodeType {
    if (this.left.findCode(ref) != null) {
      return this.left.findCode(ref);
    } else {
      return this.right.findCode(ref);
    }
  }
  findCodelist(ref: commonreferences.Reference): structure.Codelist {
    if (this.left.findCodelist(ref) != null) {
      return this.left.findCodelist(ref);
    } else {
      return this.right.findCodelist(ref);
    }
  }
  findItemType(item: commonreferences.Reference): structure.ItemType {
    if (this.left.findItemType(item) != null) {
      return this.left.findItemType(item);
    } else {
      return this.right.findItemType(item);
    }
  }
  findConcept(ref: commonreferences.Reference): structure.ConceptType {
    if (this.left.findConcept(ref) != null) {
      return this.left.findConcept(ref);
    } else {
      return this.right.findConcept(ref);
    }
  }
  findConceptScheme(ref: commonreferences.Reference): structure.ConceptSchemeType {
    if (this.left.findConceptScheme(ref) != null) {
      return this.left.findConceptScheme(ref);
    } else {
      return this.right.findConceptScheme(ref);
    }
  }
  searchDataStructure(ref: commonreferences.Reference): Array<structure.DataStructure> {
    var datastrucList: Array<structure.DataStructure> = [];
    collections.arrays.forEach(this.left.searchDataStructure(ref), function (a) {
      datastrucList.push(a);
    });
    collections.arrays.forEach(this.right.searchDataStructure(ref), function (a) {
      datastrucList.push(a);
    });
    return datastrucList;
  }
  searchDataflow(ref: commonreferences.Reference): Array<structure.Dataflow> {
    var dataflowList: Array<structure.Dataflow> = [];
    collections.arrays.forEach(this.left.searchDataflow(ref), function (a) {
      dataflowList.push(a);
    });
    collections.arrays.forEach(this.right.searchDataflow(ref), function (a) {
      dataflowList.push(a);
    });
    return dataflowList;
  }
  searchCodelist(ref: commonreferences.Reference): Array<structure.Codelist> {
    var codeList: Array<structure.Codelist> = [];
    collections.arrays.forEach(this.left.searchCodelist(ref), function (a) {
      codeList.push(a);
    });
    collections.arrays.forEach(this.right.searchCodelist(ref), function (a) {
      codeList.push(a);
    });
    return codeList;
  }
  searchItemType(item: commonreferences.Reference): Array<structure.ItemType> {
    var ittList: Array<structure.ItemType> = [];
    collections.arrays.forEach(this.left.searchItemType(item), function (a) {
      ittList.push(a);
    });
    collections.arrays.forEach(this.right.searchItemType(item), function (a) {
      ittList.push(a);
    });
    return ittList;
  }
  searchConcept(ref: commonreferences.Reference): Array<structure.ConceptType> {
    var cList: Array<structure.ConceptType> = [];
    collections.arrays.forEach(this.left.searchConcept(ref), function (a) {
      cList.push(a);
    });
    collections.arrays.forEach(this.right.searchConcept(ref), function (a) {
      cList.push(a);
    });
    return cList;
  }
  searchConceptScheme(ref: commonreferences.Reference): Array<structure.ConceptSchemeType> {
    var csList: Array<structure.ConceptSchemeType> = [];
    collections.arrays.forEach(this.left.searchConceptScheme(ref), function (a) {
      csList.push(a);
    });
    collections.arrays.forEach(this.right.searchConceptScheme(ref), function (a) {
      csList.push(a);
    });
    return csList;
  }
  save(): any {}
}

export default {
  DoubleRegistry: DoubleRegistry,
  LocalRegistry: LocalRegistry,
};
