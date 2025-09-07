import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { LoginComponent } from './login.component';

type LoginResponse = { access_token: string };

describe('LoginComponent', () => {
  let component: LoginComponent;

  let authServiceSpy: jasmine.SpyObj<Pick<AuthService, 'signIn'>>;
  let routerSpy: jasmine.SpyObj<Pick<Router, 'navigate'>>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['signIn']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function setForm(username: string, password: string, remember = false) {
    component.loginForm.setValue({ username, password, remember });
  }

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should start with an invalid form and remember=false', () => {
    expect(component.loginForm.invalid).toBeTrue();
    expect(component.loginForm.get('remember')?.value).toBeFalse();
  });

  it('should validate required username and password', () => {
    const username = component.loginForm.get('username')!;
    const password = component.loginForm.get('password')!;

    username.setValue('');
    password.setValue('');
    expect(username.invalid).toBeTrue();
    expect(password.invalid).toBeTrue();

    username.setValue('john');
    password.setValue('secret');
    expect(component.loginForm.valid).toBeTrue();
  });

  it('should not submit if the form is invalid', () => {
    setForm('', '');
    component.onSubmit();
    expect(authServiceSpy.signIn).not.toHaveBeenCalled();
  });

  it('should not submit if already loading', () => {
    setForm('john', 'secret');
    component.loading = true;

    component.onSubmit();

    expect(authServiceSpy.signIn).not.toHaveBeenCalled();
    expect(component.loading).toBeTrue();
  });

  it('should login successfully and navigate to /drones', () => {
    setForm('john', 'secret');
    const ok: LoginResponse = { access_token: 'fake-token' };
    authServiceSpy.signIn.and.returnValue(of(ok));

    component.onSubmit();

    expect(authServiceSpy.signIn).toHaveBeenCalledOnceWith('john', 'secret');
    expect(component.loading).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/drones']);
    expect(component.errorMessage).toBeNull();
  });

  it('should set errorMessage on login failure and not navigate', () => {
    setForm('john', 'wrong');
    authServiceSpy.signIn.and.returnValue(throwError(() => new Error('Invalid')));

    component.onSubmit();

    expect(authServiceSpy.signIn).toHaveBeenCalledOnceWith('john', 'wrong');
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('Invalid username or password.');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should toggle password visibility when togglePasswordVisibility is called', () => {
    const initial = component.showPassword;
    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(!initial);
    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(initial);
  });

  it('should clear errorMessage on resubmit after a failure', () => {
    setForm('john', 'wrong');
    authServiceSpy.signIn.and.returnValue(throwError(() => new Error('Invalid')));
    component.onSubmit();
    expect(component.errorMessage).toBeTruthy();

    setForm('john', 'secret');
    const ok: LoginResponse = { access_token: 'fake-token' };
    authServiceSpy.signIn.and.returnValue(of(ok));
    component.onSubmit();

    expect(component.errorMessage).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/drones']);
  });

  it('should set and reset loading correctly during submit (success case)', () => {
    setForm('john', 'secret');
    const ok: LoginResponse = { access_token: 'fake-token' };
    authServiceSpy.signIn.and.returnValue(of(ok));

    expect(component.loading).toBeFalse();
    component.onSubmit();
    expect(component.loading).toBeFalse();
  });
});
