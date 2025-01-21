import { Injectable } from '@angular/core';
import { PolicyControllerService } from '../../gen/policy-api';
import { combineLatest, map, Observable, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PolicyService {

  constructor(private policyControllerService: PolicyControllerService) {
  }

  private getPolicies(): Observable<Record<string, Record<string, Record<string, string>>>> {
    return this.policyControllerService.getPolicies().pipe(
      shareReplay(1)
    );
  }

  public getPolicy(entityType: string, policyType: string): Observable<Record<string, string>> {
    return this.getPolicies().pipe(
      map(policies => {
        console.log(policies);
        return policies[entityType][policyType];
      })
    );
  }

  public editableFields<T>(entityType: string, entity$: Observable<T>): Observable<Record<string, boolean>> {
    return combineLatest([
      entity$,
      this.getPolicy(entityType, "EditableIf")
    ]).pipe(
      map(([entity, policy]) => {
        console.log(entity, policy);
        const isEditable: Record<string, boolean> = {};
        const variables = Object.entries(entity as any).map(([field, value]) => `let ${field} = '${value}';`);
        for (const [field, expression] of Object.entries(policy)) {
          isEditable[field] = new Function('entity', `${variables.join('\n')};return (${expression})`)();
        }
        console.log('violations', isEditable);
        return isEditable;
      })
    );
  }

  public visibleFields<T>(entityType: string, entity$: Observable<T>): Observable<Record<string, boolean>> {
    return combineLatest([
      entity$,
      this.getPolicy(entityType, "VisibleIf")
    ]).pipe(
      map(([entity, policy]) => {
        console.log(entity, policy);
        const isVisible: Record<string, boolean> = {};
        const variables = Object.entries(entity as any).map(([field, value]) => `let ${field} = '${value}';`);
        for (const [field, expression] of Object.entries(policy)) {
          isVisible[field] = new Function('entity', `${variables.join('\n')};return (${expression})`)();
        }
        console.log('violations', isVisible);
        return isVisible;
      })
    );
  }
}
