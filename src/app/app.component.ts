import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as f3 from 'family-chart';
import 'family-chart/styles/family-chart.css';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private f3Chart!: any;
  private f3Card!: any;
  private f3EditTree!: any;

  ngOnInit(): void {
    fetch('https://donatso.github.io/family-chart-doc/data/data.json')
      .then((res) => res.json())
      .then((data) => this.initChart(data))
      .catch(console.error);
  }

  private initChart(data: any): void {
    this.f3Chart = f3
      .createChart('#FamilyChart', data)
      .setTransitionTime(1000)
      .setCardXSpacing(250)
      .setCardYSpacing(150);

    this.f3EditTree = this.f3Chart
      .editTree()
      .fixed(true)
      .setFields(['first name', 'last name', 'birthday', 'avatar'])
      .setEditFirst(true);

    this.f3EditTree.setEdit();

    this.initCardHtml();
    this.initCardClick();

    this.f3Chart.updateTree({ initial: true });
  }

  // ---------------- CARD HTML ----------------

  private initCardHtml(): void {
    const self = this; // 🔑 capture Angular context

    this.f3Card = this.f3Chart
      .setCardHtml()
      .setOnCardUpdate(function (this: HTMLElement, d: any) {
        if (d?.data._new_rel_data) return;
        if (self.f3EditTree.isRemovingRelative()) return;

        d3.select(this).select('.card').style('cursor', 'default');

        const cardInner = this.querySelector('.card-inner') as HTMLElement;
        if (!cardInner) return;

        self.addEditIcon(cardInner, d);
        self.addAddRelativeIcon(cardInner, d);
      });
  }

  // ---------------- EDIT ICON ----------------
  private addEditIcon(card: HTMLElement, d: any): void {
    d3.select(card)
      .append('div')
      .attr('class', 'f3-svg-circle-hover')
      .attr(
        'style',
        'cursor:pointer;width:20px;height:20px;position:absolute;top:0;right:0;'
      )
      .html(f3.icons.userEditSvgIcon())
      .select('svg')
      .style('padding', '0')
      .on('click', (e: any) => {
        e.stopPropagation();

        this.f3EditTree.open(d.data);

        if (
          this.f3EditTree.isAddingRelative() ||
          this.f3EditTree.isRemovingRelative()
        )
          return;

        this.f3Card.onCardClickDefault(e, d);
      });
  }

  // ---------------- ADD RELATIVE ICON ----------------

  private addAddRelativeIcon(card: HTMLElement, d: any): void {
    d3.select(card)
      .append('div')
      .attr('class', 'f3-svg-circle-hover')
      .attr(
        'style',
        'cursor:pointer;width:20px;height:20px;position:absolute;top:0;right:23px;'
      )
      .html(f3.icons.userPlusSvgIcon())
      .select('svg')
      .style('padding', '0')
      .on('click', (e: any) => {
        e.stopPropagation();

        this.f3EditTree.addRelativeInstance?.onCancel();

        this.f3EditTree.open(d.data);
        this.f3Card.onCardClickDefault(e, d);

        document
          .querySelector('.f3-add-relative-btn')
          ?.dispatchEvent(new Event('click'));
      });
  }

  // ---------------- CARD CLICK ----------------

  private initCardClick(): void {
    this.f3Card.setOnCardClick((e: any, d: any) => {
      if (this.f3EditTree.isAddingRelative()) {
        if (d.data._new_rel_data) {
          this.f3EditTree.open(d.data);
        } else {
          this.f3EditTree.addRelativeInstance?.onCancel();
          this.f3EditTree.closeForm();
          this.f3Card.onCardClickDefault(e, d);
        }
        return;
      }

      if (this.f3EditTree.isRemovingRelative()) {
        this.f3EditTree.open(d.data);
        return;
      }

      if (this.f3Chart.getMainDatum().id === d.data.id) {
        this.f3EditTree.open(d.data);
      } else {
        this.f3EditTree.closeForm();
      }

      this.f3Card.onCardClickDefault(e, d);
    });
  }
}
