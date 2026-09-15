/* eslint-disable */
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { numberEntriesPage } from 'src/app/api.constants';

@Component({
  selector: 'pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnInit {
  @Input() totalPages;
  @Input() currentPage;

  @Input() pageSizeVisible;
  @Input() pageSize;
  
  numberEntriesPage = numberEntriesPage;

  @Output() changePage = new EventEmitter<Object>();
  @Output() changePageSize = new EventEmitter<Object>();


  constructor() { }

  onDecrease(){
    if(this.currentPage > 1)
      this.currentPage = this.currentPage-1;
  }

  onIncrease(){
    if(this.currentPage < this.totalPages)
      this.currentPage = this.currentPage+1;
  }


  valueChange(){
    this.changePage.emit(this.currentPage)
  }


  onChangePageSize(){
    this.changePageSize.emit(this.pageSize)
  }

  ngOnInit(): void {
  }

}
